# Rilis, CI, dan operasi

## Status koneksi

Repositori: `Reliaaaa/FinTrack-Web`. Proyek Vercel `fintrack-web` telah dibuat pada tim `varelliolouis-3927s-projects`, tetapi saat panduan ini ditulis belum terhubung ke GitHub. Deployment dapat dibuat langsung dari sumber atau melalui workflow manual setelah kredensial GitHub disiapkan. Jangan menganggap proyek sudah tayang sebelum URL deployment dan hasil build terverifikasi.

## Branch dan gate rilis

1. Kerjakan fitur pada `feature/<nama>` dari `dev`; push hanya branch fitur dan ajukan PR ke `dev`.
2. `client-build.yml` berjalan pada push fitur dan PR ke `dev`/`main`. Gate: `npm ci`, typecheck, tes unit, audit dependensi, build Next.js, dan tes UI Chromium. Hasil build diunggah sebagai artifact selama 7 hari; kegagalan UI mengunggah trace/laporan. Workflow meninggalkan komentar pada PR atau commit berisi status, run, SHA, branch, serta langkah gagal.
3. Reviewer memeriksa PR dan hasil CI, lalu menggabungkan ke `dev` secara manual. Uji di preview/staging dan periksa `/api/v1/health`.
4. Ajukan PR `dev` → `main` setelah fitur dalam lingkup rilis dan gate QA lolos. Penggabungan manual oleh reviewer yang berwenang. `main` untuk rilis stabil.
5. Workflow `backend-deploy.yml` hanya berjalan atas pemicu manual: preview dari `dev`, atau production dari `main`. Jika kredensial Vercel belum diisi, validasi tetap berjalan dan langkah deploy dilewati dengan pesan jelas. Workflow menulis komentar status pada commit.

Build lokal: `npm ci && npm run typecheck && npm test && npm run test:ui && npm run build`. Jalankan build **setelah** tes UI karena server tes memakai direktori `.next` yang sama. CI memisahkan job UI dari job build.

## Konfigurasi

| Lokasi | Nama | Kegunaan |
| --- | --- | --- |
| Vercel Environment Variables | `DATABASE_URL` | PostgreSQL untuk akun/sinkronisasi; tanpa ini aplikasi hanya mode demo browser. |
| Vercel Environment Variables | `CRON_SECRET` | Bearer token kuat untuk Vercel Cron. |
| GitHub Actions Secret | `VERCEL_TOKEN` | Hanya untuk workflow deploy manual. |
| GitHub Actions Variable | `VERCEL_ORG_ID` | ID tim Vercel (`team_FZK4x4KAdyCnzf65mdKHmMWv`). |
| GitHub Actions Variable | `VERCEL_PROJECT_ID` | ID proyek Vercel (`prj_nL4Q6IIQSa6lAK22xKI4gf0SuozZ`). |

Jangan commit kredensial. `DATABASE_URL` dan `CRON_SECRET` tidak diperlukan untuk build CI mode demo. Pengaturan Production/Preview di Vercel dapat memakai database terpisah. Koneksikan GitHub repo ke proyek Vercel lewat pengaturan Git bila menginginkan auto-deploy setiap push; workflow manual cukup untuk rilis terkontrol.

PostgreSQL lokal tersedia melalui `docker compose up -d`. Gunakan URL `postgresql://fintrack:fintrack_local_only@localhost:5432/fintrack` hanya pada `.env.local`. Tabel dibuat otomatis saat akses pertama. Untuk migrasi instalasi lama, lihat [panduan database](05-database.md). Backup harian dan uji pemulihan wajib disiapkan pada penyedia database produksi.

## Verifikasi deployment

1. Periksa build Vercel berstatus Ready dan buka URL preview pada desktop/mobile.
2. `GET /api/v1/health`: `demo` bila tanpa database, `ok` dan `connected` bila database tersedia; `503` berarti koneksi gagal.
3. Saat database tersedia, uji daftar → login → catat pemasukan/pengeluaran/transfer → reload → logout/login ulang, lalu bandingkan saldo. Uji dua tab untuk respons konflik `409` dan salinan draf.
4. Uji endpoint cron dengan kredensial pada akun uji, verifikasi idempoten dan penambahan versi snapshot. Jadwal di `vercel.json` berjalan 01:00 UTC (08:00 WIB) hanya pada production deployment.
5. Periksa Core Web Vitals/Lighthouse dan backup sebelum memasukkan data keuangan riil. Pengukuran target PRD belum tersedia.

## Rollback

Untuk kegagalan UI/API, kembalikan alias produksi ke deployment Vercel sebelumnya melalui dashboard Vercel. Untuk perubahan data, pulihkan database dari backup penyedia setelah menilai transaksi yang terjadi sejak backup; deployment rollback tidak membatalkan perubahan database. Gunakan migrasi kompatibel dan backup sebelum mengubah skema. Jangan menggabungkan PR dengan CI merah atau temuan keamanan Critical/High terbuka.
