-- =============================================================
-- Dosis Obat — All-in-one SQL setup (Supabase)
-- Copy-paste FILE INI saja ke Supabase SQL Editor → klik RUN.
-- Equivalent dengan 01_schema + 02_seed_icd10 + 03_seed_drugs + 04_seed_admin.
-- =============================================================

-- ╔═══════════════════════════════════════════════════════════╗
-- ║                    PART 1: SCHEMA                         ║
-- ╚═══════════════════════════════════════════════════════════╝
-- =============================================================
-- Dosis Obat — Schema (PostgreSQL / Supabase)
-- Copy-paste seluruh file ini ke Supabase SQL Editor lalu klik RUN.
-- Idempotent: aman dijalankan ulang (akan SKIP jika sudah ada).
-- =============================================================

-- pgcrypto: untuk bcrypt password hash (digunakan di seed admin)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- Trigger: auto-update kolom updatedAt
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TABLE: User  (end-user account untuk mobile app)
-- =============================================================
CREATE TABLE IF NOT EXISTS "User" (
  "id"               TEXT        PRIMARY KEY,
  "email"            TEXT        NOT NULL UNIQUE,
  "emailLower"       TEXT        NOT NULL UNIQUE,
  "password"         TEXT        NOT NULL,
  "name"             TEXT        NOT NULL,
  "profession"       TEXT        NOT NULL DEFAULT 'LAINNYA',
  "trialEndsAt"      TIMESTAMP(3) NOT NULL,
  "currentSessionId" TEXT        UNIQUE,
  "isActive"         BOOLEAN     NOT NULL DEFAULT TRUE,
  "isEmailVerified"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "User_emailLower_idx" ON "User"("emailLower");
DROP TRIGGER IF EXISTS user_set_updated_at ON "User";
CREATE TRIGGER user_set_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TABLE: Session  (single-device session enforcement)
-- =============================================================
CREATE TABLE IF NOT EXISTS "Session" (
  "id"           TEXT         PRIMARY KEY,
  "userId"       TEXT         NOT NULL,
  "jti"          TEXT         NOT NULL UNIQUE,
  "deviceId"     TEXT         NOT NULL,
  "deviceName"   TEXT,
  "platform"     TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "revokedAt"    TIMESTAMP(3),
  "revokeReason" TEXT,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_deviceId_idx" ON "Session"("deviceId");

-- Tambahkan FK User.currentSessionId → Session.id (circular, jadi pakai ALTER)
DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_currentSessionId_fkey"
    FOREIGN KEY ("currentSessionId") REFERENCES "Session"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- TABLE: Subscription
-- =============================================================
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"              TEXT         PRIMARY KEY,
  "userId"          TEXT         NOT NULL,
  "status"          TEXT         NOT NULL,             -- TRIAL/ACTIVE/EXPIRED/CANCELLED
  "plan"            TEXT         NOT NULL,             -- MONTHLY/YEARLY/TRIAL
  "startsAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt"          TIMESTAMP(3) NOT NULL,
  "paymentProvider" TEXT,
  "externalRef"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_endsAt_idx" ON "Subscription"("status", "endsAt");
DROP TRIGGER IF EXISTS subscription_set_updated_at ON "Subscription";
CREATE TRIGGER subscription_set_updated_at BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TABLE: PatientHistory  (server-side backup; primary copy on device)
-- =============================================================
CREATE TABLE IF NOT EXISTS "PatientHistory" (
  "id"           TEXT         PRIMARY KEY,
  "userId"       TEXT         NOT NULL,
  "patientName"  TEXT         NOT NULL,
  "patientDob"   TIMESTAMP(3) NOT NULL,
  "drugId"       TEXT         NOT NULL,
  "drugNameSnap" TEXT         NOT NULL,
  "doseType"     TEXT         NOT NULL,                -- PEDIATRIC | ADULT
  "weightKg"     DOUBLE PRECISION,
  "perDoseMg"    DOUBLE PRECISION NOT NULL,
  "perDayMg"     DOUBLE PRECISION NOT NULL,
  "freqPerDay"   INTEGER      NOT NULL,
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientHistory_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PatientHistory_lookup_idx"
  ON "PatientHistory"("userId", "patientName", "patientDob");

-- =============================================================
-- TABLE: Drug
-- =============================================================
CREATE TABLE IF NOT EXISTS "Drug" (
  "id"               TEXT         PRIMARY KEY,
  "name"             TEXT         NOT NULL,
  "nameLower"        TEXT         NOT NULL UNIQUE,
  "brandNames"       TEXT         NOT NULL DEFAULT '',
  "category"         TEXT         NOT NULL,
  "routes"           TEXT         NOT NULL,             -- CSV
  "composition"      TEXT,
  "indication"       TEXT,
  "contraindication" TEXT,
  "sideEffects"      TEXT,
  "warning"          TEXT,
  -- Pediatric
  "pediMgPerKgDose"  DOUBLE PRECISION,
  "pediMgPerKgDay"   DOUBLE PRECISION,
  "pediMaxPerDose"   DOUBLE PRECISION,
  "pediMaxPerDay"    DOUBLE PRECISION,
  "pediFreqPerDay"   INTEGER,
  "pediMinAgeMonths" INTEGER,
  "pediNotes"        TEXT,
  -- Adult
  "adultDoseMin"     DOUBLE PRECISION,
  "adultDoseMax"     DOUBLE PRECISION,
  "adultMaxPerDay"   DOUBLE PRECISION,
  "adultFreqPerDay"  INTEGER,
  "adultNotes"       TEXT,
  --
  "version"          INTEGER      NOT NULL DEFAULT 1,
  "isActive"         BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Drug_nameLower_idx" ON "Drug"("nameLower");
CREATE INDEX IF NOT EXISTS "Drug_category_idx" ON "Drug"("category");
DROP TRIGGER IF EXISTS drug_set_updated_at ON "Drug";
CREATE TRIGGER drug_set_updated_at BEFORE UPDATE ON "Drug"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TABLE: DrugForm
-- =============================================================
CREATE TABLE IF NOT EXISTS "DrugForm" (
  "id"        TEXT PRIMARY KEY,
  "drugId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,             -- TABLET, SYRUP, ...
  "strength"  TEXT NOT NULL,
  "amountMg"  DOUBLE PRECISION,
  "perMl"     DOUBLE PRECISION,
  "packaging" TEXT,
  CONSTRAINT "DrugForm_drugId_fkey" FOREIGN KEY ("drugId")
    REFERENCES "Drug"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DrugForm_drugId_idx" ON "DrugForm"("drugId");

-- =============================================================
-- TABLE: Icd10
-- =============================================================
CREATE TABLE IF NOT EXISTS "Icd10" (
  "code"          TEXT         PRIMARY KEY,
  "description"   TEXT         NOT NULL,
  "descriptionId" TEXT,
  "category"      TEXT,
  "isActive"      BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Icd10_category_idx" ON "Icd10"("category");
DROP TRIGGER IF EXISTS icd10_set_updated_at ON "Icd10";
CREATE TRIGGER icd10_set_updated_at BEFORE UPDATE ON "Icd10"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TABLE: AdminUser  (admin web)
-- =============================================================
CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id"        TEXT         PRIMARY KEY,
  "email"     TEXT         NOT NULL UNIQUE,
  "password"  TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "role"      TEXT         NOT NULL DEFAULT 'admin',
  "isActive"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS adminuser_set_updated_at ON "AdminUser";
CREATE TRIGGER adminuser_set_updated_at BEFORE UPDATE ON "AdminUser"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- (Opsional, untuk Prisma compatibility)
-- Catatan: jika nanti Anda jalankan `prisma migrate deploy`, Prisma akan
-- mendeteksi tabel-tabel ini sudah ada dan tidak melakukan apapun.
-- Buat juga tabel _prisma_migrations supaya prisma tidak coba re-init:
-- =============================================================
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  VARCHAR(36) PRIMARY KEY,
  "checksum"            VARCHAR(64) NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      VARCHAR(255) NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Selesai. Lanjutkan ke 02_seed_icd10.sql, 03_seed_drugs.sql, 04_seed_admin.sql

-- ╔═══════════════════════════════════════════════════════════╗
-- ║              PART 2: SEED ICD-10 (162 kode)               ║
-- ╚═══════════════════════════════════════════════════════════╝
-- =============================================================
-- Seed ICD-10 (~150 kode rawat jalan / emergensi Indonesia)
-- Idempotent — boleh dijalankan ulang.
-- =============================================================

INSERT INTO "Icd10" ("code", "description", "descriptionId", "category") VALUES
('A00','Cholera','Kolera','Penyakit infeksi & parasit'),
('A01.0','Typhoid fever','Demam tifoid','Penyakit infeksi & parasit'),
('A02.0','Salmonella enteritis','Enteritis Salmonella','Penyakit infeksi & parasit'),
('A04.9','Bacterial intestinal infection, unspecified','Infeksi usus bakterial, tak terinci','Penyakit infeksi & parasit'),
('A06.0','Acute amoebic dysentery','Disentri amuba akut','Penyakit infeksi & parasit'),
('A08.4','Viral intestinal infection, unspecified','Gastroenteritis viral, tak terinci','Penyakit infeksi & parasit'),
('A09','Diarrhoea and gastroenteritis of presumed infectious origin','Diare & gastroenteritis (dugaan infeksi)','Penyakit infeksi & parasit'),
('A15.0','Tuberculosis of lung, confirmed','TB paru, terkonfirmasi','Penyakit infeksi & parasit'),
('A16.2','Tuberculosis of lung, without mention of confirmation','TB paru, tanpa konfirmasi bakteriologi','Penyakit infeksi & parasit'),
('A37.9','Whooping cough, unspecified','Pertusis, tak terinci','Penyakit infeksi & parasit'),
('A41.9','Sepsis, unspecified','Sepsis, tak terinci','Penyakit infeksi & parasit'),
('A49.9','Bacterial infection, unspecified','Infeksi bakteri, tak terinci','Penyakit infeksi & parasit'),
('A90','Dengue fever (classical dengue)','Demam dengue','Penyakit infeksi & parasit'),
('A91','Dengue haemorrhagic fever','Demam berdarah dengue (DBD)','Penyakit infeksi & parasit'),
('B01.9','Varicella without complication','Varisela / cacar air','Penyakit infeksi & parasit'),
('B05.9','Measles without complication','Campak','Penyakit infeksi & parasit'),
('B06.9','Rubella without complication','Rubela / campak Jerman','Penyakit infeksi & parasit'),
('B08.4','Hand, foot and mouth disease','Flu Singapura (HFMD)','Penyakit infeksi & parasit'),
('B15.9','Hepatitis A without hepatic coma','Hepatitis A','Penyakit infeksi & parasit'),
('B16.9','Acute hepatitis B without delta-agent and without hepatic coma','Hepatitis B akut','Penyakit infeksi & parasit'),
('B18.1','Chronic viral hepatitis B without delta-agent','Hepatitis B kronik','Penyakit infeksi & parasit'),
('B26.9','Mumps without complication','Parotitis / gondongan','Penyakit infeksi & parasit'),
('B34.9','Viral infection, unspecified','Infeksi virus, tak terinci','Penyakit infeksi & parasit'),
('B35.0','Tinea barbae and tinea capitis','Tinea kapitis (kurap kepala)','Penyakit infeksi & parasit'),
('B35.4','Tinea corporis','Tinea korporis (kurap badan)','Penyakit infeksi & parasit'),
('B35.6','Tinea cruris','Tinea kruris (selangkangan)','Penyakit infeksi & parasit'),
('B37.3','Candidiasis of vulva and vagina','Kandidiasis vulvovaginal','Penyakit infeksi & parasit'),
('B37.9','Candidiasis, unspecified','Kandidiasis, tak terinci','Penyakit infeksi & parasit'),
('B54','Unspecified malaria','Malaria, tak terinci','Penyakit infeksi & parasit'),
('B82.9','Intestinal parasitism, unspecified','Cacingan, tak terinci','Penyakit infeksi & parasit'),
('B86','Scabies','Skabies','Penyakit infeksi & parasit'),
('D50.9','Iron deficiency anaemia, unspecified','Anemia defisiensi besi','Penyakit darah'),
('D64.9','Anaemia, unspecified','Anemia, tak terinci','Penyakit darah'),
('E03.9','Hypothyroidism, unspecified','Hipotiroid, tak terinci','Endokrin & Metabolik'),
('E05.9','Thyrotoxicosis, unspecified','Hipertiroid, tak terinci','Endokrin & Metabolik'),
('E10.9','Type 1 diabetes mellitus without complications','DM tipe 1 tanpa komplikasi','Endokrin & Metabolik'),
('E11.9','Type 2 diabetes mellitus without complications','DM tipe 2 tanpa komplikasi','Endokrin & Metabolik'),
('E11.6','Type 2 diabetes mellitus with other specified complications','DM tipe 2 dengan komplikasi','Endokrin & Metabolik'),
('E14','Unspecified diabetes mellitus','Diabetes mellitus, tak terinci','Endokrin & Metabolik'),
('E44.0','Moderate protein-energy malnutrition','Gizi kurang sedang','Endokrin & Metabolik'),
('E46','Unspecified protein-energy malnutrition','Gizi kurang, tak terinci','Endokrin & Metabolik'),
('E66.9','Obesity, unspecified','Obesitas, tak terinci','Endokrin & Metabolik'),
('E78.5','Hyperlipidaemia, unspecified','Dislipidemia, tak terinci','Endokrin & Metabolik'),
('E86','Volume depletion','Dehidrasi','Endokrin & Metabolik'),
('E87.6','Hypokalaemia','Hipokalemia','Endokrin & Metabolik'),
('F32.9','Depressive episode, unspecified','Episode depresi, tak terinci','Mental & Perilaku'),
('F41.0','Panic disorder','Gangguan panik','Mental & Perilaku'),
('F41.1','Generalized anxiety disorder','Gangguan ansietas menyeluruh','Mental & Perilaku'),
('F43.0','Acute stress reaction','Reaksi stres akut','Mental & Perilaku'),
('F45.0','Somatization disorder','Gangguan somatisasi','Mental & Perilaku'),
('F51.0','Nonorganic insomnia','Insomnia non-organik','Mental & Perilaku'),
('G43.9','Migraine, unspecified','Migrain, tak terinci','Saraf'),
('G44.2','Tension-type headache','Nyeri kepala tipe tegang','Saraf'),
('G47.0','Disorders of initiating and maintaining sleep','Insomnia','Saraf'),
('G50.0','Trigeminal neuralgia','Neuralgia trigeminal','Saraf'),
('H10.9','Conjunctivitis, unspecified','Konjungtivitis, tak terinci','Mata'),
('H11.0','Pterygium','Pterigium','Mata'),
('H16.0','Corneal ulcer','Ulkus kornea','Mata'),
('H25.9','Senile cataract, unspecified','Katarak senilis','Mata'),
('H52.1','Myopia','Miopia','Mata'),
('H52.4','Presbyopia','Presbiopia','Mata'),
('H60.9','Otitis externa, unspecified','Otitis eksterna','Telinga'),
('H65.9','Nonsuppurative otitis media, unspecified','OMA non-supuratif','Telinga'),
('H66.0','Acute suppurative otitis media','OMA supuratif','Telinga'),
('H66.9','Otitis media, unspecified','Otitis media, tak terinci','Telinga'),
('H81.1','Benign paroxysmal vertigo','BPPV / vertigo posisional','Telinga'),
('I10','Essential (primary) hypertension','Hipertensi esensial (primer)','Kardiovaskular'),
('I11.9','Hypertensive heart disease without heart failure','Penyakit jantung hipertensi','Kardiovaskular'),
('I20.9','Angina pectoris, unspecified','Angina pektoris','Kardiovaskular'),
('I21.9','Acute myocardial infarction, unspecified','Infark miokard akut','Kardiovaskular'),
('I25.9','Chronic ischaemic heart disease, unspecified','Penyakit jantung iskemik kronis','Kardiovaskular'),
('I50.9','Heart failure, unspecified','Gagal jantung, tak terinci','Kardiovaskular'),
('I63.9','Cerebral infarction, unspecified','Stroke iskemik','Kardiovaskular'),
('I64','Stroke, not specified as haemorrhage or infarction','Stroke, tak terinci','Kardiovaskular'),
('I83.9','Varicose veins of lower extremities without ulcer or inflammation','Varises tungkai','Kardiovaskular'),
('I84.9','Unspecified haemorrhoids without complication','Hemoroid, tak terinci','Kardiovaskular'),
('J00','Acute nasopharyngitis (common cold)','Common cold / pilek biasa','Pernapasan'),
('J01.9','Acute sinusitis, unspecified','Sinusitis akut','Pernapasan'),
('J02.9','Acute pharyngitis, unspecified','Faringitis akut','Pernapasan'),
('J03.9','Acute tonsillitis, unspecified','Tonsilitis akut','Pernapasan'),
('J04.0','Acute laryngitis','Laringitis akut','Pernapasan'),
('J05.0','Acute obstructive laryngitis (croup)','Kroup / laringitis akut obstruktif','Pernapasan'),
('J06.9','Acute upper respiratory infection, unspecified','ISPA, tak terinci','Pernapasan'),
('J11.1','Influenza with other respiratory manifestations, virus not identified','Influenza dengan gejala pernapasan','Pernapasan'),
('J18.9','Pneumonia, unspecified organism','Pneumonia, tak terinci','Pernapasan'),
('J20.9','Acute bronchitis, unspecified','Bronkitis akut','Pernapasan'),
('J21.9','Acute bronchiolitis, unspecified','Bronkiolitis akut','Pernapasan'),
('J30.4','Allergic rhinitis, unspecified','Rinitis alergi','Pernapasan'),
('J35.0','Chronic tonsillitis','Tonsilitis kronik','Pernapasan'),
('J40','Bronchitis, not specified as acute or chronic','Bronkitis, tak terinci','Pernapasan'),
('J44.9','Chronic obstructive pulmonary disease, unspecified','PPOK','Pernapasan'),
('J45.9','Asthma, unspecified','Asma, tak terinci','Pernapasan'),
('J45.0','Predominantly allergic asthma','Asma alergik','Pernapasan'),
('J46','Status asthmaticus','Status asmatikus','Pernapasan'),
('K02.9','Dental caries, unspecified','Karies gigi','Pencernaan'),
('K05.0','Acute gingivitis','Gingivitis akut','Pencernaan'),
('K12.0','Recurrent oral aphthae','Sariawan / stomatitis aftosa','Pencernaan'),
('K21.9','Gastro-oesophageal reflux disease without oesophagitis','GERD','Pencernaan'),
('K25.9','Gastric ulcer, unspecified','Ulkus lambung','Pencernaan'),
('K27.9','Peptic ulcer, site unspecified','Ulkus peptikum','Pencernaan'),
('K29.7','Gastritis, unspecified','Gastritis, tak terinci','Pencernaan'),
('K30','Functional dyspepsia','Dispepsia fungsional','Pencernaan'),
('K35.8','Acute appendicitis, unspecified','Apendisitis akut','Pencernaan'),
('K52.9','Noninfective gastroenteritis and colitis, unspecified','Gastroenteritis non-infeksi','Pencernaan'),
('K57.9','Diverticular disease, unspecified','Penyakit divertikular','Pencernaan'),
('K59.0','Constipation','Konstipasi','Pencernaan'),
('K80.2','Calculus of gallbladder without cholecystitis','Batu empedu tanpa kolesistitis','Pencernaan'),
('L01.0','Impetigo','Impetigo','Kulit'),
('L02.9','Cutaneous abscess, furuncle and carbuncle, unspecified','Abses / furunkel / karbunkel kulit','Kulit'),
('L03.9','Cellulitis, unspecified','Selulitis','Kulit'),
('L20.9','Atopic dermatitis, unspecified','Dermatitis atopik','Kulit'),
('L21.9','Seborrhoeic dermatitis, unspecified','Dermatitis seboroik','Kulit'),
('L23.9','Allergic contact dermatitis, unspecified cause','Dermatitis kontak alergi','Kulit'),
('L24.9','Irritant contact dermatitis, unspecified cause','Dermatitis kontak iritan','Kulit'),
('L29.9','Pruritus, unspecified','Pruritus, tak terinci','Kulit'),
('L30.9','Dermatitis, unspecified','Dermatitis, tak terinci','Kulit'),
('L40.9','Psoriasis, unspecified','Psoriasis','Kulit'),
('L50.9','Urticaria, unspecified','Urtikaria, tak terinci','Kulit'),
('L70.0','Acne vulgaris','Akne vulgaris','Kulit'),
('M10.9','Gout, unspecified','Gout, tak terinci','Muskuloskeletal'),
('M19.9','Osteoarthritis, unspecified','Osteoartritis, tak terinci','Muskuloskeletal'),
('M25.5','Pain in joint','Nyeri sendi','Muskuloskeletal'),
('M54.5','Low back pain','Nyeri pinggang bawah (LBP)','Muskuloskeletal'),
('M54.2','Cervicalgia','Nyeri leher','Muskuloskeletal'),
('M62.6','Muscle strain','Strain otot','Muskuloskeletal'),
('M79.1','Myalgia','Mialgia','Muskuloskeletal'),
('N10','Acute tubulo-interstitial nephritis','Pielonefritis akut','Genitourinaria'),
('N18.9','Chronic kidney disease, unspecified','Penyakit ginjal kronik (CKD)','Genitourinaria'),
('N20.0','Calculus of kidney','Batu ginjal','Genitourinaria'),
('N23','Unspecified renal colic','Kolik renal','Genitourinaria'),
('N30.0','Acute cystitis','Sistitis akut','Genitourinaria'),
('N39.0','Urinary tract infection, site not specified','Infeksi saluran kemih (ISK)','Genitourinaria'),
('N40','Hyperplasia of prostate','BPH (pembesaran prostat)','Genitourinaria'),
('N76.0','Acute vaginitis','Vaginitis akut','Genitourinaria'),
('N91.2','Amenorrhoea, unspecified','Amenorea, tak terinci','Genitourinaria'),
('N94.6','Dysmenorrhoea, unspecified','Dismenorea, tak terinci','Genitourinaria'),
('O15.9','Eclampsia, unspecified as to time period','Eklampsia','Kehamilan'),
('O20.0','Threatened abortion','Abortus iminens','Kehamilan'),
('O21.0','Mild hyperemesis gravidarum','Hiperemesis gravidarum ringan','Kehamilan'),
('O80','Single spontaneous delivery','Persalinan spontan tunggal','Kehamilan'),
('P07.3','Other preterm infants','Bayi prematur (lainnya)','Perinatal'),
('P22.9','Respiratory distress of newborn, unspecified','Gangguan napas neonatus','Perinatal'),
('P59.9','Neonatal jaundice, unspecified','Ikterus neonatorum','Perinatal'),
('R05','Cough','Batuk','Gejala & Tanda'),
('R07.4','Chest pain, unspecified','Nyeri dada, tak terinci','Gejala & Tanda'),
('R10.4','Other and unspecified abdominal pain','Nyeri perut, tak terinci','Gejala & Tanda'),
('R11','Nausea and vomiting','Mual dan muntah','Gejala & Tanda'),
('R19.7','Diarrhoea, unspecified','Diare, tak terinci','Gejala & Tanda'),
('R21','Rash and other nonspecific skin eruption','Ruam kulit','Gejala & Tanda'),
('R42','Dizziness and giddiness','Pusing / vertigo','Gejala & Tanda'),
('R50.9','Fever, unspecified','Demam, tak terinci','Gejala & Tanda'),
('R51','Headache','Sakit kepala','Gejala & Tanda'),
('R52.9','Pain, unspecified','Nyeri, tak terinci','Gejala & Tanda'),
('R53','Malaise and fatigue','Lemas / fatik','Gejala & Tanda'),
('R55','Syncope and collapse','Sinkop','Gejala & Tanda'),
('R56.0','Febrile convulsions','Kejang demam','Gejala & Tanda'),
('S00.9','Superficial injury of head, part unspecified','Cedera superfisial kepala','Cedera'),
('S01.9','Open wound of head, part unspecified','Luka terbuka kepala','Cedera'),
('S06.0','Concussion','Komosio cerebri','Cedera'),
('S52.9','Fracture of forearm, unspecified','Fraktur lengan bawah','Cedera'),
('S72.9','Fracture of femur, unspecified','Fraktur femur','Cedera'),
('S81.9','Open wound of lower leg, part unspecified','Vulnus / luka tungkai bawah','Cedera'),
('T14.0','Superficial injury of unspecified body region','Cedera superfisial, tak terinci','Cedera'),
('T14.1','Open wound of unspecified body region','Vulnus / luka terbuka, tak terinci','Cedera'),
('T63.4','Toxic effect of venom of other arthropods','Gigitan serangga','Cedera'),
('T78.4','Allergy, unspecified','Alergi, tak terinci','Cedera'),
('T78.0','Anaphylactic shock due to adverse food reaction','Syok anafilaktik makanan','Cedera'),
('T78.2','Anaphylactic shock, unspecified','Syok anafilaktik, tak terinci','Cedera'),
('Z00.0','General medical examination','Pemeriksaan kesehatan umum','Faktor lain (Z)'),
('Z23','Need for immunization against single bacterial diseases','Imunisasi','Faktor lain (Z)'),
('Z34.9','Supervision of normal pregnancy, unspecified','Pengawasan kehamilan normal (ANC)','Faktor lain (Z)'),
('Z39.2','Routine postpartum follow-up','Kontrol postpartum rutin','Faktor lain (Z)')
ON CONFLICT ("code") DO NOTHING;

-- Verifikasi
SELECT COUNT(*) AS total_icd10 FROM "Icd10";

-- ╔═══════════════════════════════════════════════════════════╗
-- ║          PART 3: SEED DRUGS (30 obat + sediaan)           ║
-- ╚═══════════════════════════════════════════════════════════╝
-- =============================================================
-- Seed Drug + DrugForm (30 obat starter)
-- Idempotent — boleh dijalankan ulang.
-- =============================================================

-- ===== 1. Paracetamol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_paracetamol','Paracetamol','paracetamol','Panadol, Sanmol, Tempra, Pamol, Biogesic','Analgesik / Antipiretik','ORAL,RECTAL,INJECTION','Paracetamol (acetaminophen)','Demam dan nyeri ringan-sedang.','Hipersensitivitas paracetamol; gangguan hati berat.','Jarang: ruam, hepatotoksisitas pada dosis berlebih.','Dosis maksimum dewasa 4 g/hari. Hati-hati pada gangguan hati & alkoholik kronis.',15,1000,4000,4,0,'10–15 mg/kgBB/dosis tiap 4–6 jam, maks 60 mg/kgBB/hari (atau 4 g/hari, mana lebih kecil).',500,1000,4000,4,'500–1000 mg tiap 4–6 jam, maks 4 g/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_paracetamol_1','d_paracetamol','TABLET','500 mg',500,NULL,'Strip 10 tablet'),
('f_paracetamol_2','d_paracetamol','TABLET','650 mg',650,NULL,'Strip 10 tablet'),
('f_paracetamol_3','d_paracetamol','SYRUP','120 mg / 5 ml',120,5,'Botol 60 ml'),
('f_paracetamol_4','d_paracetamol','SYRUP','160 mg / 5 ml',160,5,'Botol 60 ml'),
('f_paracetamol_5','d_paracetamol','DROPS','100 mg / 1 ml',100,1,'Botol 15 ml'),
('f_paracetamol_6','d_paracetamol','SUPPOSITORY','125 mg',125,NULL,NULL),
('f_paracetamol_7','d_paracetamol','INJECTION','10 mg / 1 ml',10,1,'Vial 100 ml')
ON CONFLICT ("id") DO NOTHING;

-- ===== 2. Ibuprofen =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ibuprofen','Ibuprofen','ibuprofen','Proris, Bufect, Brufen, Arfen','AINS (Analgesik / Antipiretik / Antiinflamasi)','ORAL','Ibuprofen','Demam, nyeri, inflamasi.','Tukak lambung aktif, gangguan ginjal berat, asma berat, perdarahan aktif, anak < 6 bulan.','Mual, dispepsia, perdarahan saluran cerna, gangguan ginjal.','Berikan bersama makanan. Hindari pada dehidrasi.',10,400,2400,3,6,'5–10 mg/kgBB/dosis tiap 6–8 jam, maks 40 mg/kgBB/hari. Tidak untuk usia < 6 bulan.',200,400,1200,3,'200–400 mg tiap 6–8 jam, maks 1200 mg/hari (OTC). Resep dokter dapat sampai 2400 mg/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ibuprofen_1','d_ibuprofen','TABLET','200 mg',200,NULL,NULL),
('f_ibuprofen_2','d_ibuprofen','TABLET','400 mg',400,NULL,NULL),
('f_ibuprofen_3','d_ibuprofen','SYRUP','100 mg / 5 ml',100,5,'Botol 60 ml'),
('f_ibuprofen_4','d_ibuprofen','SUSPENSION','200 mg / 5 ml',200,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 3. Amoxicillin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amoxicillin','Amoxicillin','amoxicillin','Amoxsan, Yusimox, Kalmoxillin, Amoxil','Antibiotik (Penisilin)','ORAL,INJECTION','Amoxicillin trihydrate','Infeksi saluran napas, otitis media, infeksi saluran kemih, infeksi kulit.','Hipersensitivitas penisilin / sefalosporin.','Diare, mual, ruam, kandidiasis.','Tanyakan riwayat alergi penisilin. Selesaikan kursus penuh.',15,50,1000,3000,3,0,'25–50 mg/kgBB/hari dibagi 3 dosis. Untuk otitis media / pneumonia: 80–90 mg/kgBB/hari dibagi 2–3 dosis.',500,1000,3000,3,'500 mg tiap 8 jam atau 875 mg tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amoxicillin_1','d_amoxicillin','CAPSULE','250 mg',250,NULL,NULL),
('f_amoxicillin_2','d_amoxicillin','CAPSULE','500 mg',500,NULL,NULL),
('f_amoxicillin_3','d_amoxicillin','TABLET','500 mg',500,NULL,NULL),
('f_amoxicillin_4','d_amoxicillin','SYRUP','125 mg / 5 ml',125,5,'Botol 60 ml (kering)'),
('f_amoxicillin_5','d_amoxicillin','SYRUP','250 mg / 5 ml',250,5,'Botol 60 ml (kering)'),
('f_amoxicillin_6','d_amoxicillin','INJECTION','1 g vial',1000,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 4. Amoxicillin-Clavulanate =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amoxiclav','Amoxicillin-Clavulanate','amoxicillin-clavulanate','Augmentin, Clavamox, Claneksi','Antibiotik (Penisilin + Beta-laktamase Inhibitor)','ORAL,INJECTION','Amoxicillin + asam klavulanat','Infeksi resistensi beta-laktamase: sinusitis, otitis media, ISK, infeksi kulit.','Riwayat hepatitis kolestatik akibat amoxiclav, hipersensitivitas penisilin.','Diare (lebih sering dari amoxicillin), mual, ruam.','Dosis berdasarkan komponen amoxicillin.',15,45,875,1750,2,3,'25–45 mg/kgBB/hari (komponen amoxicillin) dibagi 2 dosis. Untuk infeksi berat: 90 mg/kgBB/hari.',625,1000,3000,2,'625 mg tiap 8 jam atau 1000 mg tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amoxiclav_1','d_amoxiclav','TABLET','500/125 mg',500,NULL,NULL),
('f_amoxiclav_2','d_amoxiclav','TABLET','875/125 mg',875,NULL,NULL),
('f_amoxiclav_3','d_amoxiclav','SYRUP','125/31.25 mg / 5 ml',125,5,NULL),
('f_amoxiclav_4','d_amoxiclav','SYRUP','250/62.5 mg / 5 ml',250,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 5. Cefixime =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cefixime','Cefixime','cefixime','Cefspan, Fixiphar, Helixim, Maxpro','Antibiotik (Sefalosporin Generasi 3)','ORAL','Cefixime trihydrate','ISK, gonore tanpa komplikasi, infeksi saluran napas, otitis media.','Hipersensitivitas sefalosporin.','Diare, mual, ruam.','Hati-hati pada riwayat alergi penisilin (cross-reactivity ~5%).',4,8,200,400,2,6,'8 mg/kgBB/hari dibagi 1–2 dosis.',200,400,400,2,'200 mg tiap 12 jam atau 400 mg/hari sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cefixime_1','d_cefixime','CAPSULE','100 mg',100,NULL,NULL),
('f_cefixime_2','d_cefixime','CAPSULE','200 mg',200,NULL,NULL),
('f_cefixime_3','d_cefixime','SYRUP','100 mg / 5 ml',100,5,'Botol 30 ml')
ON CONFLICT ("id") DO NOTHING;

-- ===== 6. Ceftriaxone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ceftriaxone','Ceftriaxone','ceftriaxone','Ceftrix, Terfacef, Brospec','Antibiotik (Sefalosporin Generasi 3)','INJECTION','Ceftriaxone sodium','Infeksi berat: sepsis, meningitis, pneumonia berat, demam tifoid.','Hipersensitivitas sefalosporin. Neonatus dengan hiperbilirubinemia. Tidak dicampur larutan kalsium.','Diare, eosinofilia, peningkatan enzim hati, reaksi hipersensitivitas.','Pemberian IM nyeri — encerkan dengan lidokain 1%. Pemberian IV pelan ≥ 30 menit pada anak.',50,80,2000,4000,1,0,'50–80 mg/kgBB/hari sekali sehari. Meningitis: 100 mg/kgBB/hari (maks 4 g) dibagi 1–2 dosis.',1000,2000,4000,1,'1–2 g/hari sekali sehari. Meningitis: 2 g tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ceftriaxone_1','d_ceftriaxone','INJECTION','1 g vial',1000,NULL,NULL),
('f_ceftriaxone_2','d_ceftriaxone','INJECTION','500 mg vial',500,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 7. Cefadroxil =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cefadroxil','Cefadroxil','cefadroxil','Lostacef, Droxefa, Cefat','Antibiotik (Sefalosporin Generasi 1)','ORAL','Cefadroxil monohydrate','Infeksi kulit, faringitis streptokokus, ISK tidak berkomplikasi.','Hipersensitivitas sefalosporin.','Diare, mual, ruam.','Sesuaikan dosis pada gangguan ginjal.',15,30,1000,2000,2,0,'30 mg/kgBB/hari dibagi 2 dosis.',500,1000,2000,2,'500 mg tiap 12 jam atau 1 g/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cefadroxil_1','d_cefadroxil','CAPSULE','500 mg',500,NULL,NULL),
('f_cefadroxil_2','d_cefadroxil','SYRUP','125 mg / 5 ml',125,5,NULL),
('f_cefadroxil_3','d_cefadroxil','SYRUP','250 mg / 5 ml',250,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 8. Azithromycin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_azithromycin','Azithromycin','azithromycin','Zithromax, Zibramax, Aztrin','Antibiotik (Makrolida)','ORAL,INJECTION','Azithromycin dihydrate','Infeksi saluran napas, infeksi kulit ringan, alternatif untuk alergi penisilin.','Hipersensitivitas makrolida, gangguan hati berat.','Mual, diare, nyeri perut, perpanjangan QT.','Hati-hati pada pasien dengan QT interval memanjang.',10,500,500,1,6,'10 mg/kgBB hari pertama, lalu 5 mg/kgBB/hari hari ke-2 sampai 5. Atau 10 mg/kgBB/hari × 3 hari.',250,500,500,1,'500 mg hari 1, lalu 250 mg/hari hari 2–5. Atau 500 mg/hari × 3 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_azithromycin_1','d_azithromycin','TABLET','250 mg',250,NULL,NULL),
('f_azithromycin_2','d_azithromycin','TABLET','500 mg',500,NULL,NULL),
('f_azithromycin_3','d_azithromycin','SYRUP','200 mg / 5 ml',200,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 9. Cotrimoxazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cotrimoxazole','Cotrimoxazole','cotrimoxazole','Bactrim, Sanprima, Primazole','Antibiotik (Sulfonamid + Trimethoprim)','ORAL,INJECTION','Sulfamethoxazole 400 mg + Trimethoprim 80 mg (single strength) / 800 + 160 (double strength)','ISK, profilaksis PCP, infeksi saluran napas, diare bakterial.','Defisiensi G6PD, gangguan hati/ginjal berat, hamil trimester 1 & 3, neonatus < 2 bulan.','Ruam (termasuk SJS), gangguan hematologi, kristaluria.','Asupan cairan adekuat. Stop bila ruam.',4,8,160,320,2,2,'Berdasarkan komponen trimethoprim: 8 mg/kgBB/hari dibagi 2 dosis. Untuk PCP: 15–20 mg/kgBB/hari.',160,320,640,2,'160 mg trimethoprim (= 1 tablet DS) tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cotrimoxazole_1','d_cotrimoxazole','TABLET','480 mg (SS)',480,NULL,NULL),
('f_cotrimoxazole_2','d_cotrimoxazole','TABLET','960 mg (DS)',960,NULL,NULL),
('f_cotrimoxazole_3','d_cotrimoxazole','SYRUP','240 mg / 5 ml',240,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 10. Metronidazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_metronidazole','Metronidazole','metronidazole','Flagyl, Trichodazol, Farizol','Antibiotik (Nitroimidazol)','ORAL,INJECTION,TOPICAL','Metronidazole','Infeksi anaerob, amubiasis, giardiasis, vaginosis bakterial, H. pylori (kombinasi).','Hipersensitivitas, hamil trimester 1.','Rasa logam di mulut, mual, neuropati perifer (jangka panjang).','Hindari alkohol selama dan 48 jam setelah terapi (efek disulfiram).',7.5,30,500,2000,3,0,'Amubiasis: 35–50 mg/kgBB/hari dibagi 3 dosis × 7–10 hari. Giardiasis: 15 mg/kgBB/hari.',250,500,2000,3,'500 mg tiap 8 jam × 7–10 hari (infeksi anaerob/amubiasis).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_metronidazole_1','d_metronidazole','TABLET','250 mg',250,NULL,NULL),
('f_metronidazole_2','d_metronidazole','TABLET','500 mg',500,NULL,NULL),
('f_metronidazole_3','d_metronidazole','SYRUP','125 mg / 5 ml',125,5,NULL),
('f_metronidazole_4','d_metronidazole','INJECTION','500 mg / 100 ml',500,100,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 11. Ciprofloxacin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ciprofloxacin','Ciprofloxacin','ciprofloxacin','Ciproxin, Baquinor, Interflox','Antibiotik (Fluorokuinolon)','ORAL,INJECTION,OPHTHALMIC,OTIC','Ciprofloxacin HCl','ISK, gastroenteritis bakterial, infeksi tulang, prostatitis.','Hipersensitivitas kuinolon, anak < 18 tahun (umumnya), hamil/menyusui.','Mual, diare, tendinopati, fototoksisitas, perpanjangan QT.','Tidak rutin pada anak; bila digunakan, dosis 10–20 mg/kgBB tiap 12 jam (kasus tertentu).',15,750,1500,2,12,'Hanya pada indikasi khusus (ISK kompleks, antrax). 10–20 mg/kgBB tiap 12 jam.',250,750,1500,2,'250–750 mg tiap 12 jam tergantung indikasi.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ciprofloxacin_1','d_ciprofloxacin','TABLET','250 mg',250,NULL,NULL),
('f_ciprofloxacin_2','d_ciprofloxacin','TABLET','500 mg',500,NULL,NULL),
('f_ciprofloxacin_3','d_ciprofloxacin','INJECTION','200 mg / 100 ml',200,100,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 12. Doxycycline =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_doxycycline','Doxycycline','doxycycline','Vibramycin, Dohixat, Siclidon','Antibiotik (Tetrasiklin)','ORAL','Doxycycline hyclate','Akne, leptospirosis, klamidia, malaria profilaksis, demam tifus.','Anak < 8 tahun, hamil & menyusui, hipersensitivitas tetrasiklin.','Esofagitis, fototoksisitas, perubahan warna gigi (anak).','Minum dengan air banyak, posisi tegak. Hindari paparan matahari.','Tidak direkomendasikan untuk anak < 8 tahun karena diskolorasi gigi permanen.',100,200,200,2,'100 mg tiap 12 jam (loading 200 mg hari pertama).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_doxycycline_1','d_doxycycline','CAPSULE','100 mg',100,NULL,NULL),
('f_doxycycline_2','d_doxycycline','TABLET','100 mg',100,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 13. Dexamethasone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_dexamethasone','Dexamethasone','dexamethasone','Kalmethasone, Oradexon, Mexolon','Kortikosteroid','ORAL,INJECTION,TOPICAL,OPHTHALMIC','Dexamethasone / Dexamethasone sodium phosphate','Inflamasi berat, alergi berat, edema serebral, kroup, COVID-19 hipoksemia.','Infeksi sistemik tak terkontrol, hipersensitivitas.','Hiperglikemia, retensi cairan, gangguan tidur, supresi adrenal jangka panjang.','Tappering off bila terapi > 7–10 hari.',0.15,16,16,1,0,'Kroup: 0.15–0.6 mg/kgBB sekali (maks 16 mg). Antiinflamasi: 0.08–0.3 mg/kgBB/hari.',0.5,9,16,2,'0.5–9 mg/hari tergantung indikasi. COVID-19: 6 mg/hari × 10 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_dexamethasone_1','d_dexamethasone','TABLET','0.5 mg',0.5,NULL,NULL),
('f_dexamethasone_2','d_dexamethasone','TABLET','0.75 mg',0.75,NULL,NULL),
('f_dexamethasone_3','d_dexamethasone','INJECTION','5 mg / 1 ml',5,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 14. Methylprednisolone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_methylprednisolone','Methylprednisolone','methylprednisolone','Medrol, Methylon, Lameson','Kortikosteroid','ORAL,INJECTION','Methylprednisolone / Methylprednisolone sodium succinate','Asma akut berat, alergi, rheumatologic, autoimun.','Infeksi sistemik tak terkontrol, hipersensitivitas.','Sama dengan kortikosteroid lain.','Tappering off bila terapi > 7 hari.',1,60,60,2,0,'Asma akut: 1–2 mg/kgBB/hari dibagi 1–2 dosis (maks 60 mg/hari) × 5 hari.',4,48,60,2,'4–48 mg/hari tergantung indikasi.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_methylprednisolone_1','d_methylprednisolone','TABLET','4 mg',4,NULL,NULL),
('f_methylprednisolone_2','d_methylprednisolone','TABLET','8 mg',8,NULL,NULL),
('f_methylprednisolone_3','d_methylprednisolone','TABLET','16 mg',16,NULL,NULL),
('f_methylprednisolone_4','d_methylprednisolone','INJECTION','125 mg vial',125,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 15. Cetirizine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cetirizine','Cetirizine','cetirizine','Incidal-OD, Cerini, Estin','Antihistamin H1 (generasi 2)','ORAL','Cetirizine HCl','Rinitis alergi, urtikaria.','Hipersensitivitas. Hati-hati gangguan ginjal.','Kantuk ringan, mulut kering.','Dosis 5 mg/hari pada gangguan ginjal.',0.25,10,10,1,6,'6–12 bln: 2.5 mg/hari. 1–2 thn: 2.5 mg 1–2x/hari. 2–6 thn: 5 mg/hari atau 2.5 mg 2x. > 6 thn: 10 mg/hari.',10,10,10,1,'10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cetirizine_1','d_cetirizine','TABLET','10 mg',10,NULL,NULL),
('f_cetirizine_2','d_cetirizine','SYRUP','5 mg / 5 ml',5,5,NULL),
('f_cetirizine_3','d_cetirizine','DROPS','10 mg / 1 ml',10,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 16. Loratadine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_loratadine','Loratadine','loratadine','Claritin, Lorahis, Alloris','Antihistamin H1 (generasi 2)','ORAL','Loratadine','Rinitis alergi, urtikaria kronik.','Hipersensitivitas.','Sakit kepala, kantuk ringan.','Sesuaikan dosis pada gangguan hati berat.',0.2,10,10,1,24,'2–5 thn: 5 mg/hari. > 6 thn: 10 mg/hari.',10,10,10,1,'10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_loratadine_1','d_loratadine','TABLET','10 mg',10,NULL,NULL),
('f_loratadine_2','d_loratadine','SYRUP','5 mg / 5 ml',5,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 17. Salbutamol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_salbutamol','Salbutamol','salbutamol','Ventolin, Lasal, Astharol','Bronkodilator (Beta-2 Agonis Short-acting)','ORAL,INHALATION,INJECTION','Salbutamol sulfate','Bronkospasme, asma akut, PPOK eksaserbasi.','Hipersensitivitas. Hati-hati hipertiroid, aritmia.','Tremor, takikardia, hipokalemia (dosis tinggi).','Inhaler / nebulizer = pilihan utama untuk asma akut.',0.1,4,16,4,0,'Oral: 0.1–0.15 mg/kgBB/dosis tiap 6–8 jam. Nebulizer: 0.15 mg/kgBB (min 2.5 mg, maks 5 mg).',2,4,16,4,'Oral 2–4 mg tiap 6–8 jam. Nebulizer 2.5–5 mg tiap 4–6 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_salbutamol_1','d_salbutamol','TABLET','2 mg',2,NULL,NULL),
('f_salbutamol_2','d_salbutamol','TABLET','4 mg',4,NULL,NULL),
('f_salbutamol_3','d_salbutamol','SYRUP','2 mg / 5 ml',2,5,NULL),
('f_salbutamol_4','d_salbutamol','INHALER','100 mcg / puff',0.1,NULL,NULL),
('f_salbutamol_5','d_salbutamol','INJECTION','0.5 mg / 1 ml',0.5,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 18. Ambroxol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ambroxol','Ambroxol','ambroxol','Mucopect, Mucos, Epexol','Mukolitik','ORAL','Ambroxol HCl','Sekret kental pada saluran napas.','Hipersensitivitas, ulkus peptikum aktif.','Mual, dispepsia, ruam jarang.','Pastikan asupan cairan adekuat.',0.5,30,3,0,'< 2 thn: 7.5 mg 2x. 2–5 thn: 7.5 mg 2–3x. 6–12 thn: 15 mg 2–3x.',30,30,90,3,'30 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ambroxol_1','d_ambroxol','TABLET','30 mg',30,NULL,NULL),
('f_ambroxol_2','d_ambroxol','SYRUP','15 mg / 5 ml',15,5,NULL),
('f_ambroxol_3','d_ambroxol','SYRUP','30 mg / 5 ml',30,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 19. Ondansetron =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ondansetron','Ondansetron','ondansetron','Zofran, Narfoz, Vometron','Antiemetik (5-HT3 antagonist)','ORAL,INJECTION','Ondansetron HCl','Mual & muntah karena kemoterapi, gastroenteritis berat.','Hipersensitivitas, sindrom QT panjang.','Sakit kepala, konstipasi, perpanjangan QT.','Hati-hati pada gangguan elektrolit.',0.15,8,24,3,6,'0.1–0.15 mg/kgBB tiap 8 jam, maks 8 mg/dosis.',4,8,24,3,'4–8 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ondansetron_1','d_ondansetron','TABLET','4 mg',4,NULL,NULL),
('f_ondansetron_2','d_ondansetron','TABLET','8 mg',8,NULL,NULL),
('f_ondansetron_3','d_ondansetron','INJECTION','4 mg / 2 ml',4,2,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 20. Domperidone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_domperidone','Domperidone','domperidone','Motilium, Vomistop, Vomitas','Antiemetik (Antagonis dopamin)','ORAL','Domperidone','Mual, muntah, dispepsia fungsional.','Sindrom QT panjang, perdarahan saluran cerna, prolaktinoma.','Mulut kering, sakit kepala, perpanjangan QT.','Pemakaian seminim mungkin (idealnya ≤ 7 hari).',0.25,10,30,3,12,'0.25 mg/kgBB tiap 8 jam (maks 10 mg/dosis).',10,10,30,3,'10 mg tiap 8 jam, maks 7 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_domperidone_1','d_domperidone','TABLET','10 mg',10,NULL,NULL),
('f_domperidone_2','d_domperidone','SYRUP','5 mg / 5 ml',5,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 21. Omeprazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_omeprazole','Omeprazole','omeprazole','Losec, Omevell, Stomacer','PPI (Proton Pump Inhibitor)','ORAL,INJECTION','Omeprazole','GERD, ulkus peptikum, dispepsia, profilaksis stress ulcer.','Hipersensitivitas.','Sakit kepala, diare, hipomagnesemia (jangka panjang).','Diminum 30 menit sebelum makan.',1,40,40,1,12,'1 mg/kgBB/hari sekali sehari (maks 40 mg).',20,40,80,1,'20–40 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_omeprazole_1','d_omeprazole','CAPSULE','20 mg',20,NULL,NULL),
('f_omeprazole_2','d_omeprazole','CAPSULE','40 mg',40,NULL,NULL),
('f_omeprazole_3','d_omeprazole','INJECTION','40 mg vial',40,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 22. Ranitidine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ranitidine','Ranitidine','ranitidine','Zantac, Rantin, Ranin','Antagonis H2','ORAL,INJECTION','Ranitidine HCl','Tukak lambung, GERD ringan-sedang.','Hipersensitivitas. Banyak negara tarik karena pengotor NDMA.','Sakit kepala, konstipasi.','Cek status izin edar — banyak yang ditarik karena NDMA.',2,150,300,2,1,'4–8 mg/kgBB/hari dibagi 2 dosis.',150,300,600,2,'150 mg tiap 12 jam atau 300 mg malam hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ranitidine_1','d_ranitidine','TABLET','150 mg',150,NULL,NULL),
('f_ranitidine_2','d_ranitidine','INJECTION','25 mg / 1 ml',25,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 23. Oralit =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediNotes","adultNotes")
VALUES ('d_oralit','Oralit','oralit','Oralit, Pharolit, Aqualyte','Cairan rehidrasi oral','ORAL','NaCl, KCl, Na sitrat, glukosa (formula WHO)','Rehidrasi pada diare akut.','Dehidrasi berat dengan syok (butuh IV), muntah persisten, ileus.','Hipernatremia bila penyiapan salah.','Larutkan 1 sachet dalam 200 ml air matang.','< 1 thn: 50–100 ml tiap mencret. 1–5 thn: 100–200 ml tiap mencret. ≥ 5 thn: ad libitum.','200 ml tiap mencret, semau pasien.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_oralit_1','d_oralit','TABLET','1 sachet → 200 ml',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 24. Zinc =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_zinc','Zinc','zinc','Zincpro, Zinkid, L-Zinc','Suplemen','ORAL','Zinc sulfate / Zinc gluconate','Adjuvant tata laksana diare anak (10–14 hari), defisiensi zinc.','Hipersensitivitas.','Mual, rasa logam.','Sebaiknya tidak bersamaan dengan antibiotik tetrasiklin / kuinolon.',20,20,1,0,'< 6 bln: 10 mg/hari × 10–14 hari. ≥ 6 bln: 20 mg/hari × 10–14 hari.',20,40,40,1,'20–40 mg/hari sebagai suplemen.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_zinc_1','d_zinc','TABLET','20 mg',20,NULL,NULL),
('f_zinc_2','d_zinc','SYRUP','10 mg / 5 ml',10,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 25. Furosemide =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_furosemide','Furosemide','furosemide','Lasix, Farsix, Uresix','Diuretik loop','ORAL,INJECTION','Furosemide','Edema (gagal jantung, gangguan ginjal, sirosis), hipertensi.','Anuria, hipovolemia, hipersensitivitas sulfa.','Hipokalemia, hiponatremia, dehidrasi, ototoksisitas (IV cepat).','Monitor elektrolit.',1,40,80,2,0,'Oral 1–2 mg/kgBB/dosis. IV 0.5–1 mg/kgBB/dosis tiap 6–12 jam.',20,80,240,2,'20–80 mg/hari oral. IV 20–40 mg, dapat diulang.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_furosemide_1','d_furosemide','TABLET','40 mg',40,NULL,NULL),
('f_furosemide_2','d_furosemide','INJECTION','10 mg / 1 ml',10,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 26. Amlodipine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amlodipine','Amlodipine','amlodipine','Norvask, Tensivask, Amdixal','Antihipertensi (CCB Dihidropiridin)','ORAL','Amlodipine besylate','Hipertensi, angina.','Syok kardiogenik, stenosis aorta berat.','Edema tungkai, sakit kepala, flushing.','Mulai dosis rendah pada lansia.',0.1,5,10,1,72,'≥ 6 thn: 2.5–5 mg/hari sekali sehari.',5,10,10,1,'5–10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amlodipine_1','d_amlodipine','TABLET','5 mg',5,NULL,NULL),
('f_amlodipine_2','d_amlodipine','TABLET','10 mg',10,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 27. Captopril =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_captopril','Captopril','captopril','Capoten, Tensobon, Acepress','Antihipertensi (ACE Inhibitor)','ORAL','Captopril','Hipertensi, gagal jantung, post-MI, nefropati diabetik.','Hamil, stenosis arteri renalis bilateral, riwayat angioedema ACE-I.','Batuk kering, hiperkalemia, hipotensi, angioedema.','Diminum 1 jam sebelum makan.',0.3,25,150,3,0,'Inisial 0.3 mg/kgBB tiap 8 jam, titrasi.',12.5,50,150,3,'12.5–50 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_captopril_1','d_captopril','TABLET','12.5 mg',12.5,NULL,NULL),
('f_captopril_2','d_captopril','TABLET','25 mg',25,NULL,NULL),
('f_captopril_3','d_captopril','TABLET','50 mg',50,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 28. Metformin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_metformin','Metformin','metformin','Glucophage, Glumin, Diabex','Antidiabetik (Biguanid)','ORAL','Metformin HCl','Diabetes mellitus tipe 2, sindrom ovarium polikistik.','GFR < 30 mL/min, asidosis metabolik, gagal jantung berat dekompensasi.','Mual, diare, defisiensi B12 jangka panjang, asidosis laktat (jarang).','Stop sementara saat kontras IV. Diminum bersama makan.',10,1000,2000,2,120,'≥ 10 thn: mulai 500 mg 1x, naikkan tiap 1 minggu (maks 2000 mg/hari).',500,1000,2000,3,'500 mg 1–2x/hari, titrasi sampai maks 2000 mg/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_metformin_1','d_metformin','TABLET','500 mg',500,NULL,NULL),
('f_metformin_2','d_metformin','TABLET','850 mg',850,NULL,NULL),
('f_metformin_3','d_metformin','TABLET','1000 mg',1000,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 29. Mupirocin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMinAgeMonths","pediNotes","adultNotes")
VALUES ('d_mupirocin','Mupirocin','mupirocin','Bactroban, Pibaksin, Pirotop','Antibiotik topikal','TOPICAL','Mupirocin 2%','Impetigo, infeksi kulit superfisial, dekolonisasi MRSA hidung.','Hipersensitivitas.','Iritasi lokal, gatal.','Hindari kontak mata.',2,'Oles 2–3x/hari × 5–10 hari.','Oles 2–3x/hari × 5–10 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_mupirocin_1','d_mupirocin','OINTMENT','2% / 5 g',0,NULL,NULL),
('f_mupirocin_2','d_mupirocin','OINTMENT','2% / 15 g',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 30. Hydrocortisone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMinAgeMonths","pediNotes","adultNotes")
VALUES ('d_hydrocortisone','Hydrocortisone','hydrocortisone','Berlicort, Hidcort, Steroderm','Kortikosteroid topikal (potensi rendah)','TOPICAL','Hydrocortisone 1% / 2.5%','Dermatitis, eksim, gigitan serangga.','Infeksi kulit (virus, jamur, bakteri tak diobati), rosacea, akne.','Atrofi kulit (jangka panjang), striae, telangiektasia.','Hindari di wajah jangka panjang. Untuk anak: maks 7 hari.',1,'Oles tipis 2x/hari, maks 7 hari di wajah/lipatan.','Oles tipis 2x/hari sampai gejala teratasi (maks 2 minggu).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_hydrocortisone_1','d_hydrocortisone','CREAM','1% / 5 g',0,NULL,NULL),
('f_hydrocortisone_2','d_hydrocortisone','CREAM','2.5% / 10 g',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- =============================================================
-- Verifikasi
-- =============================================================
SELECT
  (SELECT COUNT(*) FROM "Drug")     AS total_drugs,
  (SELECT COUNT(*) FROM "DrugForm") AS total_forms;

-- ╔═══════════════════════════════════════════════════════════╗
-- ║            PART 4: SEED ADMIN (1 super + 2 admin)         ║
-- ╚═══════════════════════════════════════════════════════════╝
-- =============================================================
-- Seed Admin User Default
-- =============================================================
-- 1 super_admin + 2 admin (semua password default: admin123)
-- WAJIB GANTI password setelah login pertama!
-- Password di-hash dengan bcrypt via pgcrypto (kompatibel dengan bcryptjs di backend).
--
-- Role:
--   super_admin → akses penuh, bisa kelola admin lain (di masa depan)
--   admin       → akses CRUD obat & ICD-10 standar

INSERT INTO "AdminUser" ("id", "email", "password", "name", "role", "isActive")
VALUES
  ('admin_default', 'admin@dosis.app',  crypt('admin123', gen_salt('bf', 10)), 'Super Admin', 'super_admin', TRUE),
  ('admin_001',     'admin1@dosis.app', crypt('admin123', gen_salt('bf', 10)), 'Admin Satu',  'admin',       TRUE),
  ('admin_002',     'admin2@dosis.app', crypt('admin123', gen_salt('bf', 10)), 'Admin Dua',   'admin',       TRUE)
ON CONFLICT ("email") DO NOTHING;

-- ===== CARA GANTI PASSWORD ADMIN VIA SQL =====
-- (Jalankan ini setelah login pertama, ganti 'PASSWORD_BARU_ANDA')
-- UPDATE "AdminUser"
--   SET "password" = crypt('PASSWORD_BARU_ANDA', gen_salt('bf', 10)),
--       "updatedAt" = CURRENT_TIMESTAMP
--   WHERE "email" = 'admin@dosis.app';

-- ===== CARA UPGRADE/DOWNGRADE ROLE =====
-- UPDATE "AdminUser" SET "role" = 'super_admin' WHERE "email" = '...';
-- UPDATE "AdminUser" SET "role" = 'admin'       WHERE "email" = '...';

-- Verifikasi
SELECT "id", "email", "name", "role", "isActive", "createdAt"
FROM "AdminUser"
ORDER BY "role" DESC, "email";

-- ╔═══════════════════════════════════════════════════════════╗
-- ║                    SUMMARY VERIFIKASI                     ║
-- ╚═══════════════════════════════════════════════════════════╝
SELECT
  (SELECT COUNT(*) FROM "Drug")      AS drugs,
  (SELECT COUNT(*) FROM "DrugForm")  AS forms,
  (SELECT COUNT(*) FROM "Icd10")     AS icd10,
  (SELECT COUNT(*) FROM "AdminUser") AS admins;
