# Build APK / AAB / IPA — Quick Reference

## TL;DR

```bash
cd mobile
npx eas build --platform android --profile production   # → .aab (Play Store)
npx eas build --platform android --profile preview      # → .apk (langsung pasang)
npx eas build --platform ios     --profile production   # → .ipa (App Store)
```

## Profile yang tersedia (lihat `mobile/eas.json`)

| Profile | Output | Distribusi | Catatan |
|---|---|---|---|
| `development` | dev client | internal | butuh Expo Go custom build |
| `preview` | `.apk` (Android) / iOS Simulator build | internal (sideload) | tidak ke store |
| `production` | `.aab` (Android) / `.ipa` (iOS) | store | auto-increment versi |

## Prasyarat

- Akun Expo (gratis): https://expo.dev
- Untuk iOS: akun Apple Developer ($99/thn) + Mac TIDAK wajib pakai EAS Cloud (cukup Windows/Linux)
- Untuk Android: tidak perlu akun apapun untuk APK; butuh Play Console ($25) untuk publish

## First-time setup

```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure
```

`eas build:configure` akan:
- Generate Expo project ID, simpan ke `app.json`
- Setup Android keystore (di-host EAS, atau download untuk backup)
- Setup iOS certificate + provisioning profile (otomatis via Apple ID Anda)

## Backup signing keys

**WAJIB** — kalau hilang, Anda **tidak bisa update** app yang sudah live di store.

```bash
eas credentials                   # interactive — pilih Android → Download keystore
```

Simpan keystore + password di tempat aman (password manager).

## Build local (advanced, tanpa EAS Cloud)

Hanya kalau Anda mau build di mesin sendiri (free tier EAS biasanya cukup):

```bash
# Android — butuh Android SDK + Java 17
npx expo prebuild --platform android
cd android && ./gradlew bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab

# iOS — wajib Mac + Xcode
npx expo prebuild --platform ios
cd ios && pod install
# buka ios/*.xcworkspace di Xcode → Product → Archive
```
