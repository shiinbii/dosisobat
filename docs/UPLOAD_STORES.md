# Upload Aplikasi ke Google Play Store & App Store

Panduan langkah-demi-langkah untuk publish app `Dosis Obat`.

## ⏱️ Lama Review

| Platform | Review Time |
|---|---|
| Google Play Store | 1–3 hari kerja (update bisa beberapa jam) |
| Apple App Store | 1–3 hari kerja (app baru bisa sampai 7 hari) |

---

## 0. Persiapan Aset (Wajib Kedua Platform)

Buat di Figma / Photoshop / Canva:

**Icon:**
- `mobile/assets/icon.png` — 1024×1024 PNG (untuk iOS)
- `mobile/assets/adaptive-icon.png` — 1024×1024 PNG (untuk Android)
- `mobile/assets/splash.png` — 1242×2436 atau lebih besar
- `mobile/assets/favicon.png` — 48×48 (web preview)

**Screenshots Play Store** (min 2, max 8):
- Phone: 1080×1920 atau 1080×2400
- Tablet 7": 1200×1920 (opsional)
- Tablet 10": 1920×1200 (opsional)
- **Feature graphic**: 1024×500 PNG

**Screenshots App Store**:
- iPhone 6.9" (15 Pro Max): 1320×2868
- iPhone 6.5" (14 Pro Max): 1284×2778
- iPad 13": 2064×2752 (opsional)

**Privacy Policy URL** — wajib. Bisa pakai [iubenda](https://iubenda.com), [termly](https://termly.io), atau hosting sendiri.

---

## 1. Build Pakai EAS

EAS sudah dikonfigurasi di `mobile/eas.json`. 1 command jadi `.aab` atau `.ipa`.

```bash
cd mobile
npm install -g eas-cli
eas login                     # akun Expo (gratis)
eas build:configure           # generate projectId, simpan ke app.json
```

### Android (.aab untuk Play Store)

```bash
eas build --platform android --profile production
```

EAS akan:
- Build di cloud-nya Expo (free tier 30 build/bln cukup)
- Otomatis generate signing key & simpan
- Selesai → kasih URL download `.aab`

> **Saved keystore**: jangan kehilangan! Backup dengan `eas credentials`.

### iOS (.ipa untuk App Store)

```bash
eas build --platform ios --profile production
```

Butuh **Apple Developer Program ($99/tahun)** — di prompt EAS akan minta Apple ID dan otomatis generate certificate + provisioning profile.

### APK preview (untuk distribusi langsung tanpa Play Store)

```bash
eas build --platform android --profile preview
```

Output `.apk` bisa dibagikan langsung (instal manual). Cocok untuk internal testing.

---

## 2. Google Play Store (Android)

### Persiapan

1. Daftar di [play.google.com/console](https://play.google.com/console) — **bayar $25 sekali seumur hidup**.
2. Buat Developer Account, isi profil.
3. (Opsional) Setup Service Account untuk auto-submit:
   - Console → Setup → API Access → Create new service account
   - Download JSON, simpan sebagai `mobile/google-play-service-account.json`
   - **JANGAN** commit file ini ke git

### Upload manual

1. Play Console → **Create app**:
   - Name: **Dosis Obat**
   - Default language: Indonesian (id)
   - App or game: **App**
   - Free or paid: **Paid** (atau Free dengan IAP, sesuai model langganan Anda)
2. Lengkapi **Store listing**:
   - Short description (max 80 char): *"Hitung dosis obat dewasa & anak dengan referensi ICD-10."*
   - Full description (max 4000 char): jelaskan fitur lengkap, target user (tenaga kesehatan), disclaimer
   - Upload icon (512×512), feature graphic (1024×500), 2–8 screenshots
   - Category: **Medical**
   - Email kontak, privacy policy URL
3. **Content rating**: isi questionnaire, hasilnya biasanya "Teen" untuk app medis
4. **Target audience**: pilih ≥ 18 (medical)
5. **App access**: jelaskan bahwa fitur paywall butuh login + langganan
6. **Production → Create new release**:
   - Upload `.aab` dari EAS
   - Release notes (bahasa Indonesia + Inggris)
7. **Review** → **Submit for review**

### Auto-submit (lebih cepat untuk update)

```bash
eas submit --platform android --latest
```

---

## 3. Apple App Store (iOS)

### Persiapan

1. Daftar [Apple Developer Program](https://developer.apple.com) — **$99/tahun**.
2. Login [App Store Connect](https://appstoreconnect.apple.com).
3. **My Apps → +** → New App:
   - Platform: iOS
   - Name: **Dosis Obat**
   - Primary language: Indonesian
   - Bundle ID: pilih yang otomatis dibuat EAS (`com.shiinbii.dosisobat`)
   - SKU: `dosisobat-ios-v1`

### Upload

EAS sudah upload otomatis ke App Store Connect saat build. Buka App Store Connect → app Anda → **TestFlight** untuk test, atau langsung ke **App Store** untuk submit.

### Mengisi metadata App Store Connect

1. **App Information**:
   - Privacy Policy URL: wajib
   - Category: **Medical** (primary)
2. **Pricing & Availability**: Free / Paid, pilih negara
3. **App Privacy**: deklarasi data yang dikumpulkan (email, password, dll)
4. **Version 1.0.0**:
   - Description (Indonesia + English)
   - Keywords: `dosis obat, ICD-10, kalkulator dosis, pediatri, dewasa, BPJS`
   - Support URL & Marketing URL
   - Screenshots untuk tiap ukuran iPhone/iPad
   - Build: pilih dari yang sudah di-upload EAS
   - **Sign-In Information** (untuk reviewer): siapkan akun test dengan langganan aktif
5. **Submit for Review**

### Auto-submit

```bash
eas submit --platform ios --latest
```

(Setelah lengkap di `eas.json` → submit.production.ios bagian appleId, ascAppId, appleTeamId.)

---

## 4. Yang Sering Bikin App Ditolak

| Masalah | Platform | Cara mitigasi |
|---|---|---|
| Screenshot kurang / salah ukuran | Keduanya | Gunakan template Figma resmi |
| Deskripsi terlalu generik | Keduanya | Jelaskan use case spesifik |
| App crash saat review | Keduanya | Test di emulator + 1 physical device sebelum submit |
| Privacy Policy tidak ada | Keduanya | **Wajib** — bisa pakai iubenda/termly |
| Permission tidak dijelaskan | App Store | Pastikan `app.json` infoPlist berisi alasan tiap permission |
| App medis tanpa disclaimer | App Store | Aplikasi sudah punya disclaimer first-launch ✅ |
| App mirip app lain | App Store | Tonjolkan unique value (ICD-10 ID, offline-first, single device) |
| Subscription tanpa IAP | App Store | Jika charge dari dalam app: **wajib** Apple IAP. Jika charge di website: tidak boleh link out |

---

## 5. Tips Khusus untuk App Medis di Indonesia

- **Sertakan klausul "untuk tenaga kesehatan profesional"** di deskripsi store — bantu lolos review.
- **Disclaimer first-launch** sudah ada — tunjukkan ini di Apple review notes.
- **Sumber dosis** sebaiknya cite di app (pojok info): IDAI, Pionas BPOM, BNF for Children.
- Hindari klaim diagnostik — app ini *referensi dosis*, bukan *diagnostic device* (yang akan butuh registrasi alat kesehatan ke Kemenkes).

---

## 6. TestFlight & Internal Testing (Wajib Sebelum Submit Publik)

- **iOS**: Build → TestFlight → Internal Testing → tambah email tester (max 100 internal).
- **Android**: Play Console → Testing → Internal testing track → upload `.aab` → tambah tester via email atau Google Group.

Test minimal:
- Login di 2 device (test 1-device enforcement)
- Hitung dosis paracetamol pediatri → cek hasil match perhitungan manual
- Cari ICD-10 → hasil muncul
- Putus internet → drug search & calc tetap jalan
- Trial expired → kalkulator terkunci, hubungi admin
- Admin grant subscription → user kembali aktif

---

## 7. Update Versi Berikutnya

```bash
# bump version di mobile/app.json (version, ios.buildNumber, android.versionCode)
# atau biarkan EAS auto-increment via "production": { "autoIncrement": true }
eas build --platform all --profile production
eas submit --platform all --latest
```

Update Play Store: ≤ 1 jam review untuk patch minor. App Store: 1–3 hari.
