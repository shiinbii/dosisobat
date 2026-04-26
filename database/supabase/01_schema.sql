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
