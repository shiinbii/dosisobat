# Setup Database via Supabase SQL Editor

Cara cepat setup database Supabase **tanpa CLI Prisma** — copy-paste 4 file SQL ke Supabase Dashboard.

## Project Info

- **Project ID**: `mghlcwjazzltmykpqkks`
- **Region**: Pilih **Singapore** (`ap-southeast-1`) saat buat project untuk latensi terendah dari Indonesia.

## Cara Jalankan — pilih salah satu

### 🚀 Opsi A: All-in-one (1 file, paling cepat)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → project Anda → **SQL Editor**
2. Klik **+ New query**
3. Buka file `00_all_in_one.sql` → copy seluruh isinya → paste ke editor
4. Klik **RUN** (atau `Ctrl+Enter`)
5. Tunggu ~3–5 detik, hasil verifikasi muncul di bawah

### 📋 Opsi B: Step-by-step (4 file)

Cocok kalau Anda mau lihat per-bagian / debug kalau ada error.

1. Buka **SQL Editor** → **+ New query**
2. Copy-paste **isi file** di urutan ini, klik **RUN** tiap file:

   | # | File | Isi | Lama eksekusi |
   |---|---|---|---|
   | 1 | `01_schema.sql` | Tabel + index + trigger updatedAt | ~1 detik |
   | 2 | `02_seed_icd10.sql` | 162 kode ICD-10 | ~1 detik |
   | 3 | `03_seed_drugs.sql` | 30 obat + 89 sediaan | ~2 detik |
   | 4 | `04_seed_admin.sql` | User admin default | < 1 detik |

3. Setelah selesai, cek di **Table Editor** — harusnya ada 8 tabel:
   - User, Session, Subscription, PatientHistory
   - Drug, DrugForm, Icd10, AdminUser

## Verifikasi

Setelah jalan semua, jalankan query ini di SQL Editor untuk cek jumlah data:

```sql
SELECT
  (SELECT COUNT(*) FROM "Drug")      AS drugs,
  (SELECT COUNT(*) FROM "DrugForm")  AS forms,
  (SELECT COUNT(*) FROM "Icd10")     AS icd10,
  (SELECT COUNT(*) FROM "AdminUser") AS admins;
```

Hasil yang diharapkan:
- `drugs = 30`
- `forms = 89` (kurang lebih)
- `icd10 = 162`
- `admins = 1`

## Default Login Admin Web

```
Email:    admin@dosis.app
Password: admin123
```

⚠️ **Wajib ganti password ini sebelum production**. Cara ganti via SQL ada di akhir file `04_seed_admin.sql`.

## Connection String Backend

Setelah database siap, set env var di backend:

```bash
# backend/.env
DATABASE_URL="postgresql://postgres.mghlcwjazzltmykpqkks:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mghlcwjazzltmykpqkks:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="ganti-dengan-string-acak-min-32-karakter"
PORT=3000
NODE_ENV=production

# Admin seed (akan dibuat ulang saat `npm run seed`, tapi sudah ada via SQL)
ADMIN_EMAIL="admin@dosis.app"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Default Admin"
```

Ganti `[PASSWORD]` dengan database password Supabase Anda. Region `ap-southeast-1` mengikuti region project yang Anda pilih saat create.

> Connection string lengkap & terbaru: **Supabase Dashboard → Project Settings → Database → Connection string**.

## Update Skema Selanjutnya

Setelah database hidup, kalau Anda mengubah `backend/prisma/schema.prisma`:

```bash
cd backend
npx prisma migrate dev --name nama_perubahan
```

Prisma akan baca tabel yang sudah ada, generate migration baru, dan apply ke Supabase. Tabel-tabel yang sudah ada via SQL editor tidak akan di-drop.

## Rollback / Reset

Untuk hapus semua tabel & mulai dari nol (HATI-HATI — semua data hilang):

```sql
DROP TABLE IF EXISTS "PatientHistory" CASCADE;
DROP TABLE IF EXISTS "Subscription"   CASCADE;
DROP TABLE IF EXISTS "Session"        CASCADE;
DROP TABLE IF EXISTS "User"           CASCADE;
DROP TABLE IF EXISTS "DrugForm"       CASCADE;
DROP TABLE IF EXISTS "Drug"           CASCADE;
DROP TABLE IF EXISTS "Icd10"          CASCADE;
DROP TABLE IF EXISTS "AdminUser"      CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
```

Lalu jalankan ulang 4 file SQL di atas.
