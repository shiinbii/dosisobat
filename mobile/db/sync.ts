import { supabase } from '../lib/supabase';
import { flagStorage, FLAG_LAST_SYNC_AT, FLAG_CATALOG_VERSION } from '../lib/storage';
import { getDb } from './client';

type DrugWithForms = {
  id: string;
  name: string;
  nameLower: string;
  brandNames: string;
  category: string;
  routes: string;
  composition: string | null;
  indication: string | null;
  contraindication: string | null;
  sideEffects: string | null;
  warning: string | null;
  pediMgPerKgDose: number | null;
  pediMgPerKgDay: number | null;
  pediMaxPerDose: number | null;
  pediMaxPerDay: number | null;
  pediFreqPerDay: number | null;
  pediMinAgeMonths: number | null;
  pediNotes: string | null;
  adultDoseMin: number | null;
  adultDoseMax: number | null;
  adultMaxPerDay: number | null;
  adultFreqPerDay: number | null;
  adultNotes: string | null;
  version: number;
  isActive: boolean;
  DrugForm: Array<{
    id: string;
    drugId: string;
    type: string;
    strength: string;
    amountMg: number | null;
    perMl: number | null;
    packaging: string | null;
  }>;
};

type Icd10Row = {
  code: string;
  description: string;
  descriptionId: string | null;
  category: string | null;
  isActive: boolean;
};

export async function syncCatalog(): Promise<{ drugs: number; icd10: number }> {
  const db = await getDb();

  const [drugsRes, icdRes] = await Promise.all([
    supabase
      .from('Drug')
      .select('*, DrugForm(*)')
      .eq('isActive', true)
      .order('nameLower', { ascending: true }),
    supabase
      .from('Icd10')
      .select('code, description, descriptionId, category, isActive')
      .eq('isActive', true)
      .order('code', { ascending: true }),
  ]);

  if (drugsRes.error) throw drugsRes.error;
  if (icdRes.error) throw icdRes.error;

  const drugs = (drugsRes.data ?? []) as DrugWithForms[];
  const icd10 = (icdRes.data ?? []) as Icd10Row[];
  const catalogVersion = drugs.reduce((max, d) => Math.max(max, d.version ?? 0), 0);

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync('DELETE FROM drug_form; DELETE FROM drug;');
    for (const d of drugs) {
      await tx.runAsync(
        `INSERT INTO drug (id, name, nameLower, brandNames, category, routes,
          composition, indication, contraindication, sideEffects, warning,
          pediMgPerKgDose, pediMgPerKgDay, pediMaxPerDose, pediMaxPerDay,
          pediFreqPerDay, pediMinAgeMonths, pediNotes,
          adultDoseMin, adultDoseMax, adultMaxPerDay, adultFreqPerDay, adultNotes,
          version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id, d.name, d.nameLower, d.brandNames, d.category, d.routes,
          d.composition, d.indication, d.contraindication, d.sideEffects, d.warning,
          d.pediMgPerKgDose, d.pediMgPerKgDay, d.pediMaxPerDose, d.pediMaxPerDay,
          d.pediFreqPerDay, d.pediMinAgeMonths, d.pediNotes,
          d.adultDoseMin, d.adultDoseMax, d.adultMaxPerDay, d.adultFreqPerDay, d.adultNotes,
          d.version,
        ]
      );
      for (const f of d.DrugForm ?? []) {
        await tx.runAsync(
          `INSERT INTO drug_form (id, drugId, type, strength, amountMg, perMl, packaging)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [f.id, d.id, f.type, f.strength, f.amountMg, f.perMl, f.packaging]
        );
      }
    }

    await tx.execAsync('DELETE FROM icd10;');
    for (const c of icd10) {
      await tx.runAsync(
        `INSERT INTO icd10 (code, description, descriptionId, category) VALUES (?, ?, ?, ?)`,
        [c.code, c.description, c.descriptionId, c.category]
      );
    }
  });

  await flagStorage.set(FLAG_LAST_SYNC_AT, new Date().toISOString());
  await flagStorage.set(FLAG_CATALOG_VERSION, String(catalogVersion));

  return { drugs: drugs.length, icd10: icd10.length };
}

export type LocalDrug = {
  id: string; name: string; brandNames: string; category: string; routes: string;
  composition: string | null; indication: string | null;
  contraindication: string | null; sideEffects: string | null; warning: string | null;
  pediMgPerKgDose: number | null; pediMgPerKgDay: number | null;
  pediMaxPerDose: number | null; pediMaxPerDay: number | null;
  pediFreqPerDay: number | null; pediMinAgeMonths: number | null; pediNotes: string | null;
  adultDoseMin: number | null; adultDoseMax: number | null;
  adultMaxPerDay: number | null; adultFreqPerDay: number | null; adultNotes: string | null;
  forms: Array<{ id: string; type: string; strength: string; amountMg: number | null; perMl: number | null; packaging: string | null }>;
};

export async function searchDrugs(opts: { q?: string; route?: string; limit?: number }): Promise<LocalDrug[]> {
  const db = await getDb();
  const params: any[] = [];
  const conds: string[] = [];
  if (opts.q) {
    conds.push('(nameLower LIKE ? OR brandNames LIKE ?)');
    params.push(`%${opts.q.toLowerCase()}%`, `%${opts.q}%`);
  }
  if (opts.route) {
    conds.push('routes LIKE ?');
    params.push(`%${opts.route}%`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const limit = opts.limit ?? 100;
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM drug ${where} ORDER BY nameLower ASC LIMIT ${limit}`,
    params
  );
  const ids = rows.map((r) => r.id);
  let formRows: any[] = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    formRows = await db.getAllAsync<any>(
      `SELECT * FROM drug_form WHERE drugId IN (${placeholders})`, ids
    );
  }
  const formsByDrug = new Map<string, any[]>();
  for (const f of formRows) {
    const arr = formsByDrug.get(f.drugId) ?? [];
    arr.push(f);
    formsByDrug.set(f.drugId, arr);
  }
  return rows.map((r) => ({ ...r, forms: formsByDrug.get(r.id) ?? [] }));
}

export async function getDrugById(id: string): Promise<LocalDrug | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<any>(`SELECT * FROM drug WHERE id = ?`, [id]);
  if (!r) return null;
  const forms = await db.getAllAsync<any>(`SELECT * FROM drug_form WHERE drugId = ?`, [id]);
  return { ...r, forms };
}

export async function searchIcd10(opts: { q?: string; limit?: number }): Promise<Array<{ code: string; description: string; descriptionId: string | null; category: string | null }>> {
  const db = await getDb();
  const limit = opts.limit ?? 100;
  if (!opts.q) {
    return db.getAllAsync(`SELECT * FROM icd10 ORDER BY code ASC LIMIT ${limit}`);
  }
  const q = `%${opts.q}%`;
  return db.getAllAsync(
    `SELECT * FROM icd10 WHERE code LIKE ? OR description LIKE ? OR descriptionId LIKE ? ORDER BY code ASC LIMIT ${limit}`,
    [q.toUpperCase(), q, q]
  );
}

export async function addHistory(rec: {
  patientName: string; patientDob: string; drugId: string; drugName: string;
  doseType: 'PEDIATRIC' | 'ADULT'; weightKg?: number;
  perDoseMg: number; perDayMg: number; freqPerDay: number;
  icdCode?: string; notes?: string;
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO history (patientName, patientDob, drugId, drugName, doseType, weightKg, perDoseMg, perDayMg, freqPerDay, icdCode, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rec.patientName, rec.patientDob, rec.drugId, rec.drugName, rec.doseType,
      rec.weightKg ?? null, rec.perDoseMg, rec.perDayMg, rec.freqPerDay,
      rec.icdCode ?? null, rec.notes ?? null,
    ]
  );
}

export async function listHistory(opts: { patientName?: string; patientDob?: string; limit?: number } = {}) {
  const db = await getDb();
  const limit = opts.limit ?? 200;
  if (opts.patientName && opts.patientDob) {
    return db.getAllAsync<any>(
      `SELECT * FROM history WHERE patientName = ? AND patientDob = ? ORDER BY createdAt DESC LIMIT ${limit}`,
      [opts.patientName, opts.patientDob]
    );
  }
  return db.getAllAsync<any>(`SELECT * FROM history ORDER BY createdAt DESC LIMIT ${limit}`);
}

export async function listPatients() {
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT patientName, patientDob, MAX(createdAt) as lastAt, COUNT(*) as count
     FROM history GROUP BY patientName, patientDob ORDER BY lastAt DESC`
  );
}
