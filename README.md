# Dosis Obat — Aplikasi Hitung Dosis Obat (Dewasa & Anak)

Aplikasi mobile + admin web untuk menghitung dosis obat (dewasa & anak) dengan referensi diagnosis ICD-10. Dirancang offline-first untuk pemakaian klinis. Backend pakai **Supabase** (Auth + PostgreSQL + RLS + Realtime).

## ⚠️ Peringatan Medis

Aplikasi ini adalah **alat bantu**, bukan pengganti penilaian klinis dokter / apoteker / tenaga kesehatan. Setiap pengguna wajib menerima disclaimer pada pemakaian pertama. Sebelum dipakai produksi, **konten dosis WAJIB di-review oleh dokter / apoteker bersertifikat** dengan referensi resmi (BNF for Children, IDAI, Pionas BPOM, dll).

## Struktur

```
.
├── web/          → Admin panel (Next.js 14, responsive — bisa diakses dari browser HP juga)
├── mobile/       → Mobile app (Expo / React Native)
└── docs/         → Deployment, build guide, SQL migrations (docs/sql/)  [gitignored — lokal only]
```

## Arsitektur

```
┌─────────────────┐                   ┌────────────────────────────┐
│  Mobile (Expo)  │                   │  Supabase                  │
│                 │  ──── HTTPS ────► │                            │
│  @supabase/     │                   │  • Auth (signup/in/out)    │
│  supabase-js    │                   │  • PostgreSQL + RLS        │
└─────────────────┘                   │  • Realtime (force-logout) │
                                      │                            │
┌─────────────────┐                   │                            │
│  Web (Next.js)  │  ──── HTTPS ────► │                            │
│                 │                   │                            │
│  Server Actions │                   │                            │
│  + service-role │                   │                            │
└─────────────────┘                   └────────────────────────────┘
```

Tidak ada server backend yang perlu di-deploy. Semua state di Supabase.

## Stack

| Bagian | Teknologi |
|---|---|
| Mobile | Expo SDK 51 + React Native + TypeScript + expo-router + expo-sqlite + @supabase/supabase-js |
| Web (admin) | Next.js 14 (App Router) + Tailwind CSS + @supabase/ssr |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Auth | Supabase Auth (email/password). Single-active-device via Realtime. |

## Quick Start (Development)

Prasyarat: Node 20+, npm, Android Studio (emulator) atau Expo Go di HP.

### 1. Setup Supabase

a. Buka project Supabase Anda → Settings → API → copy **anon** & **service_role** key.

b. Edit `.env`:
- `mobile/.env`: isi `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `web/.env`: isi `NEXT_PUBLIC_SUPABASE_ANON_KEY` & `SUPABASE_SERVICE_ROLE_KEY`

c. Jalankan SQL migrations di Supabase SQL Editor (urut):
   - `docs/sql/00_all_in_one.sql` — schema awal (Drug, DrugForm, Icd10, AdminUser, dll.) + seed
   - `docs/sql/05_auth_setup.sql` — profiles, admin_roles, subscriptions + trigger trial 14 hari
   - `docs/sql/07_catalog_rls.sql` — RLS catalog read
   - `docs/sql/08_catalog_write_policies.sql` — RLS catalog write (defense-in-depth)
   - `docs/sql/09_subscription_force_logout.sql` — function is_subscription_active + realtime profiles
   - `docs/sql/10_patient_history.sql` — tabel patient_history user-scoped

d. Buat admin user via Supabase Dashboard → Auth → Users → Add user
   (email `admin@dosis.app`, password pilih sendiri, centang Auto Confirm).
   Lalu jalankan `docs/sql/06_admin_seed.sql` untuk link admin role.

### 2. Web Admin

```bash
cd web
npm install
npm run dev                     # http://localhost:3001
```

URL ini bisa diakses juga dari browser di HP (Tailwind responsive).

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan QR dengan Expo Go di HP, atau tekan `a` untuk Android emulator.

## Build untuk Play Store / App Store

Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) dan [`docs/BUILDING_APK.md`](docs/BUILDING_APK.md).

Singkatnya:
- **Android (APK/AAB):** `eas build --platform android` (butuh akun Expo gratis + Google Play Console $25 lifetime)
- **iOS (IPA):** `eas build --platform ios` (butuh akun Apple Developer $99/thn)
- **Web (admin):** deploy ke Vercel — env vars Supabase di-set di Vercel dashboard

## Fitur v1

- ✅ Cari obat (filter rute: Oral / Injeksi / Topikal / dll)
- ✅ Pilih flow Dewasa atau Anak
  - Anak: input berat badan → hitung dosis (mg/kgBB)
  - Dewasa: tampilkan range dosis standar
- ✅ Tampil sediaan/bentuk obat (tablet / sirup / injeksi) + konversi ke ml/tablet
- ✅ Detail obat: komposisi, indikasi, kontraindikasi, efek samping, peringatan
- ✅ Cari diagnosis ICD-10 (kode + nama Indonesia)
- ✅ Riwayat perhitungan per pasien (lokal di SQLite + cloud backup di Supabase)
- ✅ Disclaimer medis wajib diterima saat pertama dibuka
- ✅ Offline-first: data obat & ICD-10 di-cache di SQLite, sync saat online
- ✅ Auth via Supabase Auth: register, login, logout, change password
- ✅ Trial 14 hari otomatis saat register
- ✅ Single-active-device: login di device baru → device lama auto-logout via Realtime
- ✅ Web admin untuk CRUD obat, ICD-10, manage user, grant subscription, force-logout

## Roadmap

Lihat `docs/MIGRASI_SUPABASE.md` (Fase 8–15) untuk fitur lanjutan: login UI overhaul (email/HP unified, Google sign-in), OTP, forgot password via WhatsApp, paywall, admin pricing, helpdesk realtime chat.

Tambahan dari roadmap awal:
- [ ] Interaksi obat (drug-drug interaction)
- [ ] Penyesuaian dosis untuk gangguan ginjal/hati
- [ ] Export riwayat ke PDF
- [ ] Multi-bahasa (EN)

## Lisensi

Internal / private. Tidak untuk redistribusi tanpa izin.
