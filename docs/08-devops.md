# Rilis, CI, dan operasi

## Status koneksi

Repositori [Reliaaaa/FinTrack-Web](https://github.com/Reliaaaa/FinTrack-Web) dirilis melalui proyek [fintrack-web di Vercel](https://vercel.com/varelliolouis-3927s-projects/fintrack-web). Tim memakai deployment langsung dari commit GitHub. Production sudah menerima konfigurasi PostgreSQL dari Neon. Cek fungsi runtime pada [API kesehatan](https://fintrack-web-amber-ten.vercel.app/api/v1/health). Hasil rilis tercatat di PR GitHub.

1. Setelah commit rilis siap di GitHub, hubungkan **proyek Vercel yang sudah ada** melalui Project Settings → Git → Connect Git Repository, pilih `Reliaaaa/FinTrack-Web`, dan tetapkan production branch `main`. Alternatif CLI resmi setelah login ke tim: `vercel link --scope varelliolouis-3927s-projects` lalu `vercel git connect` dari repo dengan remote `origin`. Periksa kembali bahwa project ID tetap `prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ`. Tool konektor `create_git_project` hanya dapat membuat atau menggunakan proyek yang **sudah** tertaut; tool itu tidak menghubungkan proyek existing yang belum tertaut.
2. Proyek memakai Vercel Authentication dengan Standard Protection. URL preview dan URL unik deployment memerlukan login Vercel atau tautan berbagi sementara. Domain produksi proyek adalah [fintrack-web-amber-ten.vercel.app](https://fintrack-web-amber-ten.vercel.app). Verifikasi domain dari browser tanpa login setelah deployment produksi Ready.
3. Bila Git terhubung, Vercel dapat membuat deployment dari push. Tetap gunakan PR/gate di bawah sebelum merge ke `main`. Jika memilih deployment manual, pastikan SHA yang dideploy dan URL hasilnya tercatat. Workflow `backend-deploy.yml` tersedia untuk deploy manual setelah kredensial Vercel di GitHub diatur.

## Branch dan gate rilis

1. Gunakan tiga branch permanen `feature`, `dev`, dan `main`. Sebelum mulai, sinkronkan branch kerja dengan `git fetch origin`, `git switch feature`, `git merge --ff-only origin/feature`, lalu `git merge --ff-only origin/dev`. Buat commit dan push di `feature`.
2. Ajukan PR `feature` → `dev`. GitHub Actions memeriksa sumber dan tujuan PR, typecheck, tes unit, audit dependensi, build Next.js, integrasi PostgreSQL, dan UI Chromium. Reviewer menggabungkan PR setelah pemeriksaan lulus.
3. Uji hasil di preview/staging dan periksa `/api/v1/health`. Setelah siap dirilis, ajukan PR `dev` → `main` dan gabungkan setelah pemeriksaan lulus.
4. Pertahankan ketiga branch setelah merge dan gunakan **Create a merge commit** agar riwayat tetap terhubung. Deploy produksi dari `main`. Workflow manual `backend-deploy.yml` menerima deploy preview dari `feature` atau `dev`.

Build lokal: `npm ci && npm run typecheck && npm test && npm run test:ui && npm run build`. Jalankan build **setelah** tes UI karena server tes memakai direktori `.next` yang sama. CI memisahkan job UI dari job build.

## Konfigurasi

| Lokasi | Nama | Kegunaan |
| --- | --- | --- |
| Vercel Environment Variables | `DATABASE_URL` | PostgreSQL untuk akun/sinkronisasi; tanpa ini aplikasi hanya mode demo browser. |
| Vercel Environment Variables | `CRON_SECRET` | Bearer token kuat untuk Vercel Cron. |
| Vercel Environment Variables | `APP_URL` | Origin kanonis HTTPS dari domain production; dipakai Google OAuth dan tautan reset kata sandi. |
| Vercel Environment Variables | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Opsional untuk login Google; callback harus didaftarkan pada origin `APP_URL`. |
| Vercel Environment Variables | `RESEND_API_KEY`, `RESET_FROM_EMAIL` | Opsional untuk email pemulihan kata sandi; alamat pengirim harus diverifikasi di penyedia email. |
| GitHub Actions Secret | `VERCEL_TOKEN` | Hanya untuk workflow deploy manual. |
| GitHub Actions Variable | `VERCEL_ORG_ID` | ID tim Vercel (`team_FZK4x4KAdyCnzf65mdKHmMWv`). |
| GitHub Actions Variable | `VERCEL_PROJECT_ID` | ID proyek Vercel (`prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ`). |

Simpan kredensial di Vercel atau GitHub Secrets. CI menjalankan PostgreSQL sementara dengan kredensial pengujian sendiri.

### Neon khusus FinTrack

Resource Neon untuk FinTrack memasok `DATABASE_URL` ke proyek Vercel. Environment Production memiliki `APP_URL` dan `CRON_SECRET`. Login email memakai PostgreSQL. Login Google dan pemulihan email tetap mengikuti konfigurasi penyedia masing-masing.

Sambungan Neon saat penyiapan mengisi variabel untuk Production, Preview, dan Development. Verifikasi preview dengan pembacaan status dan tampilan login. Pisahkan database Preview jika perlu melakukan pengujian yang menulis data.

Jalur melalui Vercel dashboard: buka Storage/Marketplace → Neon pada tim yang sama, tambahkan proyek `fintrack-web` ke akses instalasi, buat resource database baru bernama khusus FinTrack dengan paket Free dan region yang dipilih, lalu sambungkan resource itu ke **Production saja**. Buat resource/branch terpisah untuk Preview sebelum menghubungkannya ke Preview. Jangan biarkan pilihan default yang menghubungkan satu database ke Production, Preview, dan Development jika data harus terpisah. Pastikan koneksi menghasilkan `DATABASE_URL` di lingkungan yang tepat; jika nama variabel berbeda, tambahkan `DATABASE_URL` sebagai Secret environment variable yang menunjuk URL PostgreSQL Neon yang benar. Jangan salin nilainya ke GitHub atau dokumen.

Jalur CLI resmi dari sesi Vercel yang terautentikasi dan direktori yang sudah `vercel link`:

```bash
vercel integration update neon --installation icfg_NPQLHr7Gbxm2sDSQJg0t59nB --projects prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ
vercel integration add neon --name fintrack-prod --meta region=sin1 --environment production
vercel integration add neon --name fintrack-preview --meta region=sin1 --environment preview
vercel integration list fintrack-web
vercel env list
```

Periksa pilihan paket Free dan metadata pada layar sebelum menjalankan perintah `integration add`; perintah itu membuat resource sungguhan. Alternatif untuk resource Neon yang sudah ada: `vercel integration resource connect <nama-resource> fintrack-web --environment production`. Setelah konfigurasi, buat deployment **baru** karena perubahan environment variable tidak berlaku surut pada deployment lama. `/api/v1/health` harus melaporkan `ok` dan `connected`; `503` perlu diperiksa sebelum menguji akun.

PostgreSQL lokal tersedia melalui `docker compose up -d`. Gunakan URL `postgresql://fintrack:fintrack_local_only@localhost:5432/fintrack` hanya pada `.env.local`. Tabel dibuat otomatis saat akses pertama. Untuk migrasi instalasi lama, lihat [panduan database](05-database.md). Backup harian dan uji pemulihan wajib disiapkan pada penyedia database produksi.

## Verifikasi deployment

1. Periksa build Vercel berstatus Ready dan buka URL preview pada desktop/mobile.
2. `GET /api/v1/health`: `demo` bila tanpa database, `ok` dan `connected` bila database tersedia; `503` berarti koneksi gagal.
3. Saat database tersedia, uji daftar → login → catat pemasukan/pengeluaran/transfer → reload → logout/login ulang, lalu bandingkan saldo. Uji dua tab untuk respons konflik `409` dan salinan draf.
4. Uji endpoint cron dengan kredensial pada akun uji, verifikasi idempoten dan penambahan versi snapshot. Jadwal di `vercel.json` berjalan 01:00 UTC (08:00 WIB) hanya pada production deployment.
5. Periksa Core Web Vitals/Lighthouse dan backup sebelum memasukkan data keuangan riil. Pengukuran target PRD belum tersedia.

## Rollback

Untuk kegagalan UI/API, kembalikan alias produksi ke deployment Vercel sebelumnya melalui dashboard Vercel. Untuk perubahan data, pulihkan database dari backup penyedia setelah menilai transaksi yang terjadi sejak backup; deployment rollback tidak membatalkan perubahan database. Gunakan migrasi kompatibel dan backup sebelum mengubah skema. Jangan menggabungkan PR dengan CI merah atau temuan keamanan Critical/High terbuka.
