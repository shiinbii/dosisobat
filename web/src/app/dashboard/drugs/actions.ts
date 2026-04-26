'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type DrugFormInput = {
  type: string;
  strength: string;
  amountMg?: number | null;
  perMl?: number | null;
  packaging?: string | null;
};

export type DrugInput = {
  name: string;
  brandNames: string;
  category: string;
  routes: string;
  composition?: string | null;
  indication?: string | null;
  contraindication?: string | null;
  sideEffects?: string | null;
  warning?: string | null;
  pediMgPerKgDose?: number | null;
  pediMgPerKgDay?: number | null;
  pediMaxPerDose?: number | null;
  pediMaxPerDay?: number | null;
  pediFreqPerDay?: number | null;
  pediMinAgeMonths?: number | null;
  pediNotes?: string | null;
  adultDoseMin?: number | null;
  adultDoseMax?: number | null;
  adultMaxPerDay?: number | null;
  adultFreqPerDay?: number | null;
  adultNotes?: string | null;
  isActive?: boolean;
  forms: DrugFormInput[];
};

const N = <T,>(v: T | null | undefined): T | null => (v == null ? null : v);

function newId(): string {
  // crypto.randomUUID tersedia di Node 19+ dan browser modern
  return crypto.randomUUID();
}

export async function createDrug(data: DrugInput): Promise<{ id: string }> {
  const id = newId();
  const nameLower = data.name.toLowerCase().trim();

  const { error: e1 } = await supabaseAdmin.from('Drug').insert({
    id,
    name: data.name,
    nameLower,
    brandNames: data.brandNames ?? '',
    category: data.category,
    routes: data.routes,
    composition: N(data.composition),
    indication: N(data.indication),
    contraindication: N(data.contraindication),
    sideEffects: N(data.sideEffects),
    warning: N(data.warning),
    pediMgPerKgDose: N(data.pediMgPerKgDose),
    pediMgPerKgDay: N(data.pediMgPerKgDay),
    pediMaxPerDose: N(data.pediMaxPerDose),
    pediMaxPerDay: N(data.pediMaxPerDay),
    pediFreqPerDay: N(data.pediFreqPerDay),
    pediMinAgeMonths: N(data.pediMinAgeMonths),
    pediNotes: N(data.pediNotes),
    adultDoseMin: N(data.adultDoseMin),
    adultDoseMax: N(data.adultDoseMax),
    adultMaxPerDay: N(data.adultMaxPerDay),
    adultFreqPerDay: N(data.adultFreqPerDay),
    adultNotes: N(data.adultNotes),
    version: 1,
    isActive: data.isActive ?? true,
  });
  if (e1) throw new Error(`Gagal create Drug: ${e1.message}`);

  if (data.forms.length > 0) {
    const formRows = data.forms.map((f) => ({
      id: newId(),
      drugId: id,
      type: f.type,
      strength: f.strength,
      amountMg: N(f.amountMg),
      perMl: N(f.perMl),
      packaging: N(f.packaging),
    }));
    const { error: e2 } = await supabaseAdmin.from('DrugForm').insert(formRows);
    if (e2) throw new Error(`Gagal create DrugForm: ${e2.message}`);
  }

  revalidatePath('/dashboard/drugs');
  return { id };
}

export async function updateDrug(id: string, data: DrugInput): Promise<void> {
  const nameLower = data.name.toLowerCase().trim();

  // Ambil version sekarang
  const { data: current, error: eFetch } = await supabaseAdmin
    .from('Drug')
    .select('version')
    .eq('id', id)
    .single();
  if (eFetch) throw new Error(`Drug tidak ditemukan: ${eFetch.message}`);

  const { error: eUpd } = await supabaseAdmin
    .from('Drug')
    .update({
      name: data.name,
      nameLower,
      brandNames: data.brandNames ?? '',
      category: data.category,
      routes: data.routes,
      composition: N(data.composition),
      indication: N(data.indication),
      contraindication: N(data.contraindication),
      sideEffects: N(data.sideEffects),
      warning: N(data.warning),
      pediMgPerKgDose: N(data.pediMgPerKgDose),
      pediMgPerKgDay: N(data.pediMgPerKgDay),
      pediMaxPerDose: N(data.pediMaxPerDose),
      pediMaxPerDay: N(data.pediMaxPerDay),
      pediFreqPerDay: N(data.pediFreqPerDay),
      pediMinAgeMonths: N(data.pediMinAgeMonths),
      pediNotes: N(data.pediNotes),
      adultDoseMin: N(data.adultDoseMin),
      adultDoseMax: N(data.adultDoseMax),
      adultMaxPerDay: N(data.adultMaxPerDay),
      adultFreqPerDay: N(data.adultFreqPerDay),
      adultNotes: N(data.adultNotes),
      isActive: data.isActive ?? true,
      version: (current.version ?? 0) + 1,
    })
    .eq('id', id);
  if (eUpd) throw new Error(`Gagal update Drug: ${eUpd.message}`);

  // Replace forms: delete-all-and-insert
  const { error: eDelF } = await supabaseAdmin.from('DrugForm').delete().eq('drugId', id);
  if (eDelF) throw new Error(`Gagal hapus form lama: ${eDelF.message}`);

  if (data.forms.length > 0) {
    const formRows = data.forms.map((f) => ({
      id: newId(),
      drugId: id,
      type: f.type,
      strength: f.strength,
      amountMg: N(f.amountMg),
      perMl: N(f.perMl),
      packaging: N(f.packaging),
    }));
    const { error: eIns } = await supabaseAdmin.from('DrugForm').insert(formRows);
    if (eIns) throw new Error(`Gagal insert form baru: ${eIns.message}`);
  }

  revalidatePath('/dashboard/drugs');
  revalidatePath(`/dashboard/drugs/${id}`);
}

export async function deleteDrug(id: string): Promise<void> {
  const { data: current } = await supabaseAdmin
    .from('Drug')
    .select('version')
    .eq('id', id)
    .single();
  const { error } = await supabaseAdmin
    .from('Drug')
    .update({ isActive: false, version: (current?.version ?? 0) + 1 })
    .eq('id', id);
  if (error) throw new Error(`Gagal hapus: ${error.message}`);
  revalidatePath('/dashboard/drugs');
}

export async function getDrugById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('Drug')
    .select('*, DrugForm(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  // Normalisasi: DrugForm -> forms, untuk match shape DrugForm component
  const { DrugForm: forms, ...rest } = data as any;
  return { ...rest, forms: forms ?? [] };
}
