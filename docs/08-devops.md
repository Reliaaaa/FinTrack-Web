# Rilis, CI, dan operasi

## Status koneksi

Repositori: [Reliaaaa/FinTrack-Web](https://github.com/Reliaaaa/FinTrack-Web). Proyek Vercel `fintrack-web` (`prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ`) berada pada tim `varelliolouis-3927s-projects`. Hingga pengecekan 25 November 2026, proyek memakai deployment langsung dari commit GitHub. Staging untuk perubahan alur akun dan privasi berstatus Ready dengan delapan halaman dan endpoint kesehatan merespons HTTP 200. Endpoint kesehatan menunjukkan `demo` karena database terkelola belum disambungkan. Rilis dan pemeriksaannya tercatat di PR GitHub.

1. Setelah commit rilis siap di GitHub, hubungkan **proyek Vercel yang sudah ada** melalui Project Settings → Git → Connect Git Repository, pilih `Reliaaaa/FinTrack-Web`, dan tetapkan production branch `main`. Alternatif CLI resmi setelah login ke tim: `vercel link --scope varelliolouis-3927s-projects` lalu `vercel git connect` dari repo dengan remote `origin`. Periksa kembali bahwa project ID tetap `prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ`. Tool konektor `create_git_project` hanya dapat membuat atau menggunakan proyek yang **sudah** tertaut; tool itu tidak menghubungkan proyek existing yang belum tertaut.
2. Proyek memakai Vercel Authentication dengan Standard Protection. URL preview dan URL unik deployment memerlukan login Vercel atau tautan berbagi sementara. Domain produksi proyek adalah [fintrack-web-amber-ten.vercel.app](https://fintrack-web-amber-ten.vercel.app). Verifikasi domain dari browser tanpa login setelah deployment produksi Ready.
3. Bila Git terhubung, Vercel dapat membuat deployment dari push. Tetap gunakan PR/gate di bawah sebelum merge ke `main`. Jika memilih deployment manual, pastikan SHA yang dideploy dan URL hasilnya tercatat. Workflow `backend-deploy.yml` belum bisa dipicu melalui GitHub Actions sampai file tersebut hadir di default branch `main`.

## Branch dan gate rilis

1. Kerjakan fitur pada `feature/<nama>` dari `dev`; push hanya branch fitur dan ajukan PR ke `dev`.
2. `client-build.yml` berjalan pada push fitur dan PR ke `dev`/`main`. Gate: `npm ci`, typecheck, tes unit, audit dependensi, build Next.js, tes integrasi PostgreSQL 16 (migrasi, cron, dan akun), dan tes UI Chromium. Hasil build diunggah sebagai artifact selama 7 hari; kegagalan UI mengunggah trace/laporan. Workflow meninggalkan komentar pada PR atau commit berisi status, run, SHA, branch, serta langkah gagal.
3. Reviewer memeriksa PR dan hasil CI, lalu menggabungkan ke `dev` secara manual. Uji di preview/staging dan periksa `/api/v1/health`.
4. Ajukan PR `dev` → `main` setelah fitur dalam lingkup rilis dan gate QA lolos. Penggabungan manual oleh reviewer yang berwenang. `main` untuk rilis stabil.
5. Workflow `backend-deploy.yml` hanya berjalan atas pemicu manual: preview dari `feature/*` atau `dev`, production hanya dari `main`. GitHub `workflow_dispatch` baru tersedia setelah file workflow masuk ke default branch `main`; sampai itu terjadi, gunakan konektor Vercel untuk deployment staging langsung. Jika kredensial Vercel belum diisi, validasi tetap berjalan dan langkah deploy dilewati dengan pesan jelas. Workflow menulis komentar status pada commit.

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

Jangan commit kredensial. Pada 25 November 2026 daftar environment variables Vercel masih kosong; akses API GitHub untuk memeriksa Secrets/Variables ditolak `403`, sehingga keberadaannya belum dapat dipastikan. `DATABASE_URL` dan `CRON_SECRET` tidak diperlukan untuk build CI mode demo. Workflow manual baru dapat melakukan deploy setelah Secrets/Variables GitHub dan file workflow pada default branch tersedia.

### Neon khusus FinTrack

Integrasi Neon (`icfg_NPQLHr7Gbxm2sDSQJg0t59nB`) sudah terpasang pada tim dengan paket **Free** (`free_v3`, tanpa kartu pembayaran). Namun `projectSelection: selected` dan `projects: []`: instalasi belum memberi akses ke proyek FinTrack, dan belum ada resource atau koneksi database pada proyek. Produk Neon yang tersedia meminta region; `sin1` adalah opsi dekat Indonesia. Aplikasi memakai autentikasi sendiri, sehingga Neon Auth bawaan tidak diperlukan.

Jalur melalui Vercel dashboard: buka Storage/Marketplace → Neon pada tim yang sama, tambahkan proyek `fintrack-web` ke akses instalasi, buat resource database baru bernama khusus FinTrack dengan paket Free dan region yang dipilih, lalu sambungkan resource itu ke **Production saja**. Buat resource/branch terpisah untuk Preview sebelum menghubungkannya ke Preview. Jangan biarkan pilihan default yang menghubungkan satu database ke Production, Preview, dan Development jika data harus terpisah. Pastikan koneksi menghasilkan `DATABASE_URL` di lingkungan yang tepat; jika nama variabel berbeda, tambahkan `DATABASE_URL` sebagai Secret environment variable yang menunjuk URL PostgreSQL Neon yang benar. Jangan salin nilainya ke GitHub atau dokumen.

Jalur CLI resmi dari sesi Vercel yang terautentikasi dan direktori yang sudah `vercel link`:

```bash
vercel integration update neon --installation icfg_NPQLHr7Gbxm2sDSQJg0t59nB --projects prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ
vercel integration add neon --name fintrack-prod --meta region=sin1 --environment production
vercel integration add neon --name fintrack-preview --meta region=sin1 --environment preview
vercel integration list fintrack-web
vercel env list
```

Periksa pilihan paket Free dan metadata pada layar sebelum menjalankan perintah `integration add`; perintah itu membuat resource sungguhan. Alternatif untuk resource Neon yang sudah ada: `vercel integration resource connect <nama-resource> fintrack-web --environment production`. Workspace otomatis saat ini tidak memiliki login/token Vercel CLI; konektor yang tersedia dapat membaca instalasi dan produk, tetapi tidak menyediakan aksi provisioning resource Neon. Karena itu belum ada database yang dibuat atau disambungkan oleh langkah investigasi ini. Setelah konfigurasi, buat deployment **baru** karena perubahan environment variable tidak berlaku surut pada deployment lama. `/api/v1/health` harus melaporkan `ok` dan `connected`; `503` perlu diperiksa sebelum menguji akun.

PostgreSQL lokal tersedia melalui `docker compose up -d`. Gunakan URL `postgresql://fintrack:fintrack_local_only@localhost:5432/fintrack` hanya pada `.env.local`. Tabel dibuat otomatis saat akses pertama. Untuk migrasi instalasi lama, lihat [panduan database](05-database.md). Backup harian dan uji pemulihan wajib disiapkan pada penyedia database produksi.

## Verifikasi deployment

1. Periksa build Vercel berstatus Ready dan buka URL preview pada desktop/mobile.
2. `GET /api/v1/health`: `demo` bila tanpa database, `ok` dan `connected` bila database tersedia; `503` berarti koneksi gagal.
3. Saat database tersedia, uji daftar → login → catat pemasukan/pengeluaran/transfer → reload → logout/login ulang, lalu bandingkan saldo. Uji dua tab untuk respons konflik `409` dan salinan draf.
4. Uji endpoint cron dengan kredensial pada akun uji, verifikasi idempoten dan penambahan versi snapshot. Jadwal di `vercel.json` berjalan 01:00 UTC (08:00 WIB) hanya pada production deployment.
5. Periksa Core Web Vitals/Lighthouse dan backup sebelum memasukkan data keuangan riil. Pengukuran target PRD belum tersedia.

## Rollback

Untuk kegagalan UI/API, kembalikan alias produksi ke deployment Vercel sebelumnya melalui dashboard Vercel. Untuk perubahan data, pulihkan database dari backup penyedia setelah menilai transaksi yang terjadi sejak backup; deployment rollback tidak membatalkan perubahan database. Gunakan migrasi kompatibel dan backup sebelum mengubah skema. Jangan menggabungkan PR dengan CI merah atau temuan keamanan Critical/High terbuka.
