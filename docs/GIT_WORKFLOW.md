# Git Workflow — Dosis Obat

Repo: https://github.com/shiinbii/dosisobat

## Branches

| Branch | Tujuan |
|---|---|
| `main` | **Production** — yang di-deploy ke Play Store, App Store, server production |
| `shiinbii` | **Development** — branch utama developer (default lokal) |
| `feature/*` | feature branches (dari `shiinbii`) |

## Setup pertama kali (dari mesin lokal)

```bash
cd "D:/kerja/Dosis Obat Anak/dosis obat anak"

# Init repo
git init
git checkout -b shiinbii         # default branch lokal

# First commit
git add .
git commit -m "initial: monorepo (mobile + backend + admin) + seed data"

# Add remote
git remote add origin https://github.com/shiinbii/dosisobat.git

# Push branch shiinbii dulu
git push -u origin shiinbii

# Buat branch main dari shiinbii dan push
git checkout -b main
git push -u origin main

# Kembali ke branch dev
git checkout shiinbii
```

> Jika repo GitHub `shiinbii/dosisobat` belum ada, buat dulu di github.com (kosong, jangan init README).

## Workflow harian

```bash
# Pastikan di branch shiinbii
git checkout shiinbii
git pull

# Kerjakan fitur
git add .
git commit -m "feat(mobile): tambah filter ICD-10 berdasarkan kategori"
git push

# Saat siap rilis → merge ke main
git checkout main
git pull
git merge shiinbii
git push                          # → trigger deploy production
git checkout shiinbii             # kembali ke dev
```

## Auto-deploy ke production

Saat branch `main` di-push:
- **Backend**: Railway / Render auto-deploy
- **Admin**: Vercel auto-deploy
- **Mobile**: tidak auto — Anda jalankan `eas build` dan submit manual (atau via GitHub Action, lihat di bawah)

## Auto-build mobile via GitHub Actions (opsional)

Buat `.github/workflows/build-mobile.yml`:

```yaml
name: Build Mobile (production)
on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
jobs:
  build:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: mobile } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm install
      - run: eas build --platform all --profile production --non-interactive --no-wait
```

Tambahkan secret `EXPO_TOKEN` di GitHub repo settings (generate di https://expo.dev/accounts/[user]/settings/access-tokens).

## Commit message convention

Ikuti [Conventional Commits](https://www.conventionalcommits.org):
- `feat(scope): ...` — fitur baru
- `fix(scope): ...` — bugfix
- `docs(scope): ...` — dokumentasi
- `refactor(scope): ...` — refactor tanpa ubah behavior
- `chore(scope): ...` — maintenance

Scope: `mobile`, `backend`, `admin`, `db`, atau spesifik fitur.

Contoh:
- `feat(mobile): tambah dose calculator pediatri`
- `fix(backend): perbaiki single-device check race condition`
- `chore(db): seed 5 obat baru`
