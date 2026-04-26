# Mobile App — Dosis Obat

Expo (React Native) + TypeScript + expo-router + expo-sqlite (offline cache).

## Run dev

`.env` sudah dibuat — edit `EXPO_PUBLIC_API_URL` kalau backend Anda di host lain.

```bash
npm install
npx expo start             # scan QR with Expo Go, or press a/i for emulator
```

> Untuk physical device, set `EXPO_PUBLIC_API_URL` ke IP LAN PC Anda
> (mis. `http://192.168.1.10:3000`), bukan `localhost` / `10.0.2.2`.

## Asset placeholder

File-file berikut wajib dibuat sebelum build production:
- `assets/icon.png` (1024×1024)
- `assets/adaptive-icon.png` (1024×1024)
- `assets/splash.png` (1242×2436 atau lebih besar)
- `assets/favicon.png` (48×48)

Sementara dev, app akan jalan tanpa asset ini (Expo akan warn).

## Build untuk store

Gunakan EAS Build (setup di `eas.json` sudah ada):

```bash
npm install -g eas-cli
eas login
eas build:configure          # ikuti petunjuk, generate projectId

# Android Play Store (.aab)
eas build --platform android --profile production

# iOS App Store (.ipa) — butuh Mac & Apple Developer
eas build --platform ios --profile production

# Internal preview APK (untuk distribusi langsung di Indonesia)
eas build --platform android --profile preview
```

Setelah build selesai, EAS akan kasih URL untuk download `.aab` / `.apk` / `.ipa`.

## Auto-submit ke store (opsional)

Edit `eas.json` bagian `submit` (Apple ID, ASC App ID, service account JSON Google), lalu:

```bash
eas submit --platform android --latest
eas submit --platform ios --latest
```
