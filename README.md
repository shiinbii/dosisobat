# Dosis Obat — Aplikasi Hitung Dosis Obat (Dewasa & Anak)

Aplikasi mobile + admin web + backend untuk menghitung dosis obat (dewasa & anak) dengan referensi diagnosis ICD-10. Dirancang offline-first untuk pemakaian klinis.

## ⚠️ Peringatan Medis

Aplikasi ini adalah **alat bantu**, bukan pengganti penilaian klinis dokter / apoteker / tenaga kesehatan. Setiap pengguna wajib menerima disclaimer pada pemakaian pertama. Sebelum dipakai produksi, **konten dosis WAJIB di-review oleh dokter / apoteker bersertifikat** dengan referensi resmi (BNF for Children, IDAI, Pionas BPOM, dll).

## Struktur Monorepo

```
.
├── backend/      → API server (Fastify + Prisma + PostgreSQL)
├── admin/        → Web admin panel (Next.js)
├── mobile/       → Mobile app (Expo / React Native)
└── docs/         → Deployment & build guide
```

## Stack

| Bagian | Teknologi |
|---|---|
| Mobile | Expo SDK 51 + React Native + TypeScript + expo-router + expo-sqlite |
| Backend | Node 20 + Fastify + Prisma + PostgreSQL |
| Admin | Next.js 14 (App Router) + Tailwind CSS |
| Auth admin | JWT (email + password) |
| Mobile auth | _Tidak ada_ — siapa saja boleh pakai aplikasi mobile |

## Quick Start (Development)

Prasyarat: Node 20+, pnpm/npm, Docker Desktop, Android Studio (untuk emulator), Expo Go (untuk test di HP).

> File `.env` untuk backend/admin/mobile **sudah dibuat** di masing-masing folder. Cukup edit kalau perlu (mis. ganti `[PASSWORD]` di `backend/.env` dengan DB password Supabase Anda).

### 1. Database (Supabase)

Pilih salah satu cara setup:
- **Cara cepat (no-CLI)**: copy-paste 4 file di `database/supabase/*.sql` ke Supabase SQL Editor — atau pakai 1 file all-in-one `database/supabase/00_all_in_one.sql`. Detail: [`database/supabase/README.md`](database/supabase/README.md).
- **Cara Prisma**: `cd backend && npm install && npx prisma migrate deploy && npm run seed`

### 2. Backend

```bash
cd backend
npm install
npm run dev                     # http://localhost:3000
```

### 3. Admin Panel

```bash
cd admin
npm install
npm run dev                     # http://localhost:3001
```

Login default admin: `admin@dosis.app` / `admin123` — **WAJIB ganti sebelum produksi**.

### 4. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan QR dengan Expo Go di HP, atau tekan `a` untuk Android emulator.

## Build untuk Play Store / App Store

Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) dan [`docs/BUILDING_APK.md`](docs/BUILDING_APK.md).

Singkatnya:
- **Android (APK/AAB):** `eas build --platform android` (butuh akun Expo gratis)
- **iOS (IPA):** `eas build --platform ios` (butuh akun Apple Developer $99/thn dan Mac untuk submit)
- **Backend:** Docker image siap deploy ke Railway / Render / VPS
- **Admin:** deploy ke Vercel atau VPS

## Fitur v1

- ✅ Cari obat (filter rute: Oral / Injeksi / Topikal / dll)
- ✅ Pilih flow Dewasa atau Anak
  - Anak: input berat badan → hitung dosis (mg/kgBB)
  - Dewasa: tampilkan range dosis standar
- ✅ Tampil sediaan/bentuk obat (tablet / sirup / injeksi) + konversi ke ml/tablet
- ✅ Detail obat: komposisi, indikasi, kontraindikasi, efek samping, peringatan
- ✅ Cari diagnosis ICD-10 (kode + nama Indonesia)
- ✅ Riwayat perhitungan per pasien (key: nama + tanggal lahir, lokal di HP)
- ✅ Disclaimer medis wajib diterima saat pertama dibuka
- ✅ Offline-first: data obat & ICD-10 di-cache di SQLite, sync saat online
- ✅ Admin web untuk CRUD obat & ICD-10

## Roadmap

- [ ] Interaksi obat (drug-drug interaction)
- [ ] Penyesuaian dosis untuk gangguan ginjal/hati
- [ ] Export riwayat ke PDF
- [ ] Multi-bahasa (EN)
- [ ] SSO / login klinis (jika dibutuhkan)

## Lisensi

Internal / private. Tidak untuk redistribusi tanpa izin.
