# Deployment Guide — Dosis Obat

Panduan deploy 3 komponen: backend, admin web, dan mobile app.

---

## A. Backend + Database

### Opsi 1: Railway (paling cepat, $5/bln)

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

### Opsi 2: VPS (Docker, lebih murah jangka panjang)

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

### Opsi 3: Render

Mirip Railway. Buat **Web Service** dari repo (root `backend/`), Build cmd `npm install && npx prisma generate && npm run build`, Start cmd `npx prisma migrate deploy && npm start`. Add Render Postgres add-on.

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
