# Tutorial Lengkap: Setup Database Supabase (Opsi All-in-One)

Panduan **step-by-step** dari nol sampai database siap dipakai backend.
Estimasi waktu: **5–10 menit**.

---

## 🎯 Yang Akan Anda Lakukan

1. Dapatkan **database password** dari Supabase
2. Tempel password ke `backend/.env`
3. Copy-paste 1 file SQL ke Supabase SQL Editor
4. Verifikasi data masuk
5. (Opsional) Test backend konek ke Supabase

---

## 📌 BAGIAN 1 — Dapatkan Database Password

### Langkah 1.1 — Login ke Supabase

1. Buka https://supabase.com/dashboard di browser
2. Login pakai akun yang Anda pakai untuk buat project `mghlcwjazzltmykpqkks`
3. Anda akan masuk ke **All projects** — klik project Anda

### Langkah 1.2 — Buka Project Settings

Di sidebar kiri (di dalam project), cari ikon **⚙️ Settings** (paling bawah).

```
[Home]
[Table Editor]
[SQL Editor]      ← nanti dipakai di Bagian 2
[Database]
[Auth]
[Storage]
...
[⚙️ Project Settings]  ← KLIK INI
```

### Langkah 1.3 — Pilih "Database"

Di halaman Settings, di sidebar kiri ada sub-menu:

```
General
Database          ← KLIK INI
API
Auth
Edge Functions
Storage
...
```

### Langkah 1.4 — Cari Bagian "Database password"

Scroll halaman, cari kotak **"Database password"**.

**Kondisi A: Anda masih ingat password yang Anda set saat create project**
→ Lompat ke Langkah 1.5.

**Kondisi B: Anda LUPA password (atau belum pernah set)**

1. Klik tombol **"Reset database password"**
2. Masukkan password baru (catat dulu! tulis di Notepad)
   - Saran: minimal 16 karakter, campur huruf-angka-simbol
   - Contoh: `Dosi$Ob4t!2026Sup4base`
3. Klik **"Reset password"**
4. ⚠️ **Setelah reset**, koneksi yang sudah ada akan putus. Aman kalau Anda baru mulai.

### Langkah 1.5 — Copy Connection String

Masih di halaman **Database**, scroll ke bawah cari bagian **"Connection string"**.

Ada 4 tab: `URI` | `PSQL` | `Golang` | `JDBC` | `.NET` — pilih tab **`URI`**.

Di bawahnya ada 2 mode:
- **Transaction pooler** ← yang ini dipakai untuk runtime app
- **Session pooler** atau **Direct connection** ← untuk migrasi

Tekan **"Show password"** atau **"Reveal password"** untuk munculkan password di string.

Anda akan lihat string seperti ini (password sudah ter-substitusi otomatis):
```
postgresql://postgres.mghlcwjazzltmykpqkks:Dosi$Ob4t!2026Sup4base@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Catat dengan baik password yang muncul** — itu yang dipakai di langkah berikutnya.

---

## 📌 BAGIAN 2 — Edit `backend/.env`

### Langkah 2.1 — Buka File `.env`

Buka file ini di IDE (Android Studio / VS Code / Notepad):

```
D:\kerja\Dosis Obat Anak\dosis obat anak\backend\.env
```

### Langkah 2.2 — Cari Baris `DATABASE_URL` dan `DIRECT_URL`

Anda akan lihat:

```env
DATABASE_URL="postgresql://postgres.mghlcwjazzltmykpqkks:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mghlcwjazzltmykpqkks:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Langkah 2.3 — Ganti `[PASSWORD]` dengan Password Asli

Misalkan password Anda `Dosi$Ob4t!2026Sup4base`, hasilnya:

```env
DATABASE_URL="postgresql://postgres.mghlcwjazzltmykpqkks:Dosi$Ob4t!2026Sup4base@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mghlcwjazzltmykpqkks:Dosi$Ob4t!2026Sup4base@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

⚠️ **PENTING tentang karakter spesial dalam password:**

Kalau password Anda mengandung `@`, `#`, `?`, `/`, `:`, `&`, `+`, `=`, `%`, atau `space` → **WAJIB di-encode URL**:

| Karakter | Encoding | Contoh |
|---|---|---|
| `@` | `%40` | `pa@ss` → `pa%40ss` |
| `#` | `%23` | `pa#ss` → `pa%23ss` |
| `?` | `%3F` | `pa?ss` → `pa%3Fss` |
| `/` | `%2F` | `pa/ss` → `pa%2Fss` |
| `:` | `%3A` | `pa:ss` → `pa%3Ass` |
| `&` | `%26` | `pa&ss` → `pa%26ss` |
| `%` | `%25` | `pa%ss` → `pa%25ss` |
| ` ` (space) | `%20` | |
| `$`, `!`, `*` | aman, tidak perlu encode | |

**Cara aman**: pakai password yang HANYA berisi huruf + angka. Hindari simbol di atas.

### Langkah 2.4 — Save File `.env`

`Ctrl+S` (atau `Cmd+S` di Mac).

### Langkah 2.5 — Verifikasi `.env` Tidak Ke-Push ke Git

```bash
cd "D:\kerja\Dosis Obat Anak\dosis obat anak"
git status
```

Pastikan **TIDAK ADA** `backend/.env` di output. Kalau ada — STOP, jangan commit. Cek `.gitignore`.

---

## 📌 BAGIAN 3 — Jalankan SQL All-in-One

### Langkah 3.1 — Buka SQL Editor di Supabase

Kembali ke Supabase Dashboard → project Anda → di sidebar kiri klik **`SQL Editor`** (ikon pensil di lipatan kertas).

### Langkah 3.2 — Buat Query Baru

Klik tombol **`+ New query`** (atas-kanan) atau **`+ New Snippet`**.

Editor kosong akan terbuka.

### Langkah 3.3 — Buka File SQL di Komputer Anda

Buka file ini:

```
D:\kerja\Dosis Obat Anak\dosis obat anak\database\supabase\00_all_in_one.sql
```

(Buka pakai Notepad / VS Code — yang penting bisa Select All).

### Langkah 3.4 — Copy Seluruh Isi File

- `Ctrl+A` (select all — pilih semua)
- `Ctrl+C` (copy)

Anda akan copy ~777 baris.

### Langkah 3.5 — Paste ke SQL Editor Supabase

Klik di area editor Supabase (yang kosong tadi), lalu:

- `Ctrl+V` (paste)

Editor sekarang penuh berisi SQL.

### Langkah 3.6 — Klik RUN

Tombol **`RUN`** ada di kanan-bawah editor (atau pencet `Ctrl+Enter`).

```
[ ▶ RUN ]   ← klik
```

⏳ Tunggu **3–5 detik**.

### Langkah 3.7 — Cek Hasil

Di bagian bawah editor akan muncul **Results** dengan tabel:

```
drugs | forms | icd10 | admins
------+-------+-------+--------
   30 |    89 |   162 |      1
```

✅ **Kalau angkanya match seperti di atas → setup database BERES**.

❌ Kalau ada error merah:
- Cek pesan error
- Lihat panduan **Troubleshooting** di bawah

---

## 📌 BAGIAN 4 — Verifikasi via Table Editor

### Langkah 4.1 — Buka Table Editor

Sidebar kiri → klik **`Table Editor`** (ikon tabel).

### Langkah 4.2 — Cek 8 Tabel Sudah Ada

Di sidebar tabel kiri Anda harusnya lihat:

```
public schema:
  ✓ AdminUser         (1 row)
  ✓ Drug              (30 rows)
  ✓ DrugForm          (89 rows)
  ✓ Icd10             (162 rows)
  ✓ PatientHistory    (0 rows)
  ✓ Session           (0 rows)
  ✓ Subscription      (0 rows)
  ✓ User              (0 rows)
  ✓ _prisma_migrations
```

Klik salah satu (misal `Drug`) → Anda akan lihat 30 obat: Paracetamol, Ibuprofen, Amoxicillin, dst.

---

## 📌 BAGIAN 5 (Opsional) — Test Backend Konek ke Supabase

### Langkah 5.1 — Install Dependencies Backend

```bash
cd "D:\kerja\Dosis Obat Anak\dosis obat anak\backend"
npm install
```

Tunggu ~2 menit.

### Langkah 5.2 — Generate Prisma Client

```bash
npx prisma generate
```

### Langkah 5.3 — Test Konek

```bash
npx prisma db pull --print
```

Kalau berhasil, output mulai dengan `// schema.prisma` dan list tabel-tabel Anda.

❌ Kalau error `Can't reach database server` → cek password / koneksi internet / firewall.

### Langkah 5.4 — Jalankan Backend

```bash
npm run dev
```

Buka browser ke http://localhost:3000/health → harus muncul:
```json
{"ok":true,"service":"dosis-obat-backend","time":"..."}
```

✅ Backend siap. Mobile & admin sudah bisa konek.

---

## 🔧 Troubleshooting

### Error: `Can't reach database server at aws-0-ap-southeast-1.pooler.supabase.com`

**Penyebab umum:**
1. Password salah → cek lagi password di Supabase Dashboard
2. Karakter spesial di password tidak di-encode → lihat Bagian 2.3
3. Project Supabase **paused** (free tier auto-pause setelah 7 hari idle) → buka dashboard project, klik tombol "Restore" / "Resume"

### Error: `relation "Drug" already exists`

Database sudah pernah di-seed. Aman — file SQL idempotent, tapi pesan ini muncul kalau Anda jalankan `01_schema.sql` lagi setelah sudah ada tabel. Boleh di-ignore.

### Error: `permission denied for schema public`

Anda mungkin pakai connection string yang salah (bukan postgres user). Pastikan pakai connection string dari **Project Settings → Database** (yang dimulai dengan `postgres.xxxx:`), bukan dari API settings.

### Hasil verifikasi `drugs=0` setelah RUN

Berarti seed gagal. Cek:
1. `SELECT * FROM "Drug" LIMIT 5;` — apakah error?
2. Kalau iya → schema belum dibuat. Jalankan `01_schema.sql` dulu.

### Lupa password Supabase

Reset di Project Settings → Database → tombol **"Reset database password"**. Setelah reset:
- Update `backend/.env` dengan password baru
- Re-deploy backend kalau sudah deploy production

---

## ⚡ Cheat Sheet

```
1. Supabase Dashboard → Project Settings → Database
2. Catat / reset Database password
3. Edit backend/.env → ganti [PASSWORD] dengan password asli (2 baris)
4. Supabase → SQL Editor → New query
5. Copy-paste isi database/supabase/00_all_in_one.sql
6. Klik RUN → tunggu 3-5 detik
7. Verifikasi: drugs=30, forms=89, icd10=162, admins=1
8. cd backend && npm install && npm run dev
9. http://localhost:3000/health → {"ok":true}
```

Selesai 🎉

---

## ⚠️ Catatan Keamanan

- ❗ **JANGAN commit `backend/.env`** ke Git. Sudah di-gitignore — jangan dibuka.
- ❗ **JANGAN share password** di chat / screenshot publik.
- ❗ Password admin default `admin123` **WAJIB diganti** sebelum production. Cara ganti ada di akhir file `04_seed_admin.sql`.

## Login Admin Web Default

Setelah backend & admin jalan, buka http://localhost:3001:

```
Email:    admin@dosis.app
Password: admin123
```
