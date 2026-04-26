import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('dosis.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS drug (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameLower TEXT NOT NULL,
      brandNames TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      routes TEXT NOT NULL,
      composition TEXT,
      indication TEXT,
      contraindication TEXT,
      sideEffects TEXT,
      warning TEXT,
      pediMgPerKgDose REAL,
      pediMgPerKgDay REAL,
      pediMaxPerDose REAL,
      pediMaxPerDay REAL,
      pediFreqPerDay INTEGER,
      pediMinAgeMonths INTEGER,
      pediNotes TEXT,
      adultDoseMin REAL,
      adultDoseMax REAL,
      adultMaxPerDay REAL,
      adultFreqPerDay INTEGER,
      adultNotes TEXT,
      version INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_drug_namelower ON drug(nameLower);
    CREATE INDEX IF NOT EXISTS idx_drug_category ON drug(category);

    CREATE TABLE IF NOT EXISTS drug_form (
      id TEXT PRIMARY KEY,
      drugId TEXT NOT NULL REFERENCES drug(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      strength TEXT NOT NULL,
      amountMg REAL,
      perMl REAL,
      packaging TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_form_drug ON drug_form(drugId);

    CREATE TABLE IF NOT EXISTS icd10 (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      descriptionId TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      patientDob TEXT NOT NULL,
      drugId TEXT NOT NULL,
      drugName TEXT NOT NULL,
      doseType TEXT NOT NULL,
      weightKg REAL,
      perDoseMg REAL,
      perDayMg REAL,
      freqPerDay INTEGER,
      icdCode TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_history_patient ON history(patientName, patientDob);
  `);

  // Migrasi: tambah kolom cloudId (untuk sync ke Supabase) kalau belum ada.
  // SQLite ALTER TABLE ADD COLUMN tidak punya IF NOT EXISTS, jadi cek dulu.
  const cols = await _db.getAllAsync<{ name: string }>(`PRAGMA table_info(history)`);
  if (!cols.some((c) => c.name === 'cloudId')) {
    await _db.execAsync(`
      ALTER TABLE history ADD COLUMN cloudId TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_history_cloudid ON history(cloudId) WHERE cloudId IS NOT NULL;
    `);
  }

  return _db;
}

export async function clearLocalCatalog() {
  const db = await getDb();
  await db.execAsync(`DELETE FROM drug_form; DELETE FROM drug; DELETE FROM icd10;`);
}
