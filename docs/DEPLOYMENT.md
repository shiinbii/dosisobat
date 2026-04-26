# Deployment Guide — Dosis Obat

Panduan deploy 3 komponen: backend, admin web, dan mobile app.

---

## A. Backend + Database

### Opsi 1: Supabase (DB) + Railway/Render (BE) — paling populer

Pisahkan database dan compute. Supabase untuk Postgres, Railway/Render untuk Fastify backend.

#### 1) Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com).
2. **New project** — pilih region terdekat (mis. **Singapore** `ap-southeast-1` atau **Tokyo** `ap-northeast-1`). Project Anda saat ini di Tokyo. Simpan password DB.
3. Project Settings → Database → **Connection string** → ada 2 string yang dibutuhkan:

   - **Transaction pooler** (port 6543) — runtime
     ```
     postgresql://postgres.xxxx:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - **Direct connection** (port 5432) — untuk Prisma migrate
     ```
     postgresql://postgres.xxxx:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
     ```

4. Isi env var di backend:
   ```
   DATABASE_URL=<transaction pooler URL>
   DIRECT_URL=<direct URL>
   ```

5. Apply migrasi & seed — **2 cara**, pilih salah satu:

   **Cara A — via Supabase SQL Editor (paling cepat, tanpa CLI)**

   Buka Supabase Dashboard → SQL Editor → copy-paste 4 file ini berurutan, klik RUN tiap file:
   1. `database/supabase/01_schema.sql`     → semua tabel + index + trigger
   2. `database/supabase/02_seed_icd10.sql`  → 162 kode ICD-10
   3. `database/supabase/03_seed_drugs.sql`  → 30 obat + sediaan
   4. `database/supabase/04_seed_admin.sql`  → admin default (`admin@dosis.app` / `admin123`)

   Detail di [`database/supabase/README.md`](../database/supabase/README.md).

   **Cara B — via Prisma CLI (kalau Anda pakai Node.js dev)**

   ```bash
   cd backend
   npx prisma migrate deploy
   npm run seed
   ```

6. (Opsional) Tabel bisa dilihat langsung di **Supabase Studio** (Table Editor) untuk debug data.

#### Catatan Supabase Free Tier
- 500 MB database, 2 GB transfer/bulan — cukup untuk MVP
- **Auto-pause** setelah 7 hari idle. Bangunkan dengan request apa saja, atau upgrade ke Pro ($25/bln) supaya tidak pause
- Backup harian baru di Pro plan; di Free tier backup manual via `pg_dump`

#### 2) Deploy backend ke Railway / Render

Lihat **Opsi 2** di bawah, tapi skip plugin Postgres (pakai Supabase) — cuma deploy backend dan set env-nya ke Supabase URL.

---

### Opsi 2: Railway (BE + DB sekaligus, $5/bln)

1. Buat akun di [railway.app](https://railway.app), connect GitHub `shiinbii/dosisobat`.
2. **New Project → Deploy from GitHub repo** → pilih repo, branch `main`, root `backend/`.
3. Add **PostgreSQL** plugin. Railway auto-set `DATABASE_URL`.
4. Tambah env var:
   - `JWT_SECRET` = (random string panjang, min 32 char)
   - `NODE_ENV` = `production`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (untuk seed pertama)
5. Settings → Networking → **Generate Domain** → catat URL (mis. `https://dosis-backend.up.railway.app`).
6. Setelah container start pertama kali, jalankan seed:
   ```bash
   railway run npm run seed
   ```

### Opsi 3: VPS (Docker, lebih murah jangka panjang)

Spec minimal: 1 vCPU, 1 GB RAM, Ubuntu 22.04.

```bash
# di VPS
git clone https://github.com/shiinbii/dosisobat.git
cd dosisobat
cp backend/.env.example backend/.env
# edit backend/.env: ganti JWT_SECRET, ADMIN_PASSWORD

docker compose up -d
docker compose exec backend npm run seed   # seed sekali saat pertama
```

Lalu pasang reverse proxy (Caddy/Nginx) untuk HTTPS.

#### Caddyfile minimal
```
api.dosisobat.com {
    reverse_proxy localhost:3000
}
```

### Opsi 4: Render

Mirip Railway. Buat **Web Service** dari repo (root `backend/`), Build cmd `npm install && npx prisma generate && npm run build`, Start cmd `npx prisma migrate deploy && npm start`. Add Render Postgres add-on (atau pakai Supabase).

### Health check

```bash
curl https://api.dosisobat.com/health
# → {"ok":true,"service":"dosis-obat-backend",...}
```

---

## B. Admin Web (Next.js)

### Vercel (rekomendasi)

1. Buat akun [vercel.com](https://vercel.com), connect repo.
2. **Import** repo, set root directory `admin/`.
3. Env var: `NEXT_PUBLIC_API_URL` = URL backend Anda.
4. Deploy. Otomatis di-build saat push ke `main`.

### Self-host (Docker)

Buat `admin/Dockerfile` mirip backend (Next.js standalone). Lalu deploy ke VPS yang sama.

---

## C. Mobile App — Lihat [`UPLOAD_STORES.md`](UPLOAD_STORES.md)

---

## Checklist Pra-Production

- [ ] Ganti `JWT_SECRET` dengan random string ≥ 32 karakter
- [ ] Ganti password admin default (`admin@dosis.app` / `admin123`)
- [ ] HTTPS aktif (Let's Encrypt via Caddy/Certbot)
- [ ] Backup PostgreSQL otomatis (`pg_dump` cron, atau snapshot Railway)
- [ ] Aktifkan rate limiting di Fastify (jika app sudah ramai)
- [ ] Privacy Policy URL siap (wajib untuk Play Store & App Store)
- [ ] Konten dosis di-review dokter / apoteker bersertifikat
- [ ] Disclaimer diuji muncul saat first launch
- [ ] Test 1-device enforcement (login di 2 HP)
- [ ] Test offline mode (matikan internet → app tetap jalan dengan data lokal)
