# FinTrack Web

Aplikasi pencatat keuangan pribadi berbahasa Indonesia. Dibangun dengan Next.js, React, TypeScript, PostgreSQL, dan Recharts. Antarmuka mengikuti enam layar ekspor Google Stitch yang disertakan di [`docs/`](docs/). Cara pengguliran dan tipografi dijelaskan di [panduan desain](docs/03-design.md).

[FinTrack Web di Vercel](https://fintrack-web-amber-ten.vercel.app) · [Masuk atau daftar](https://fintrack-web-amber-ten.vercel.app/login)

![Dasbor FinTrack Web](docs/dashboard-desktop.png)

## Fitur yang tersedia

- Dasbor responsif dengan arus kas enam bulan, distribusi pengeluaran, status anggaran, dan transaksi terbaru.
- CRUD transaksi pemasukan, pengeluaran, dan transfer. Saldo dompet dihitung dari saldo awal dan transaksi agar transfer tidak menggandakan kekayaan bersih.
- CRUD dompet, arsip dompet, anggaran per kategori, jadwal berulang, dan pengaturan tema.
- Pencarian, filter, dan paginasi transaksi; ekspor CSV dan XLSX; PDF melalui dialog cetak browser.
- Lampiran foto struk PNG/JPEG/WebP hingga 1 MB pada transaksi.
- Halaman `/login` menyediakan registrasi dan login email ketika PostgreSQL tersambung. Akun baru memiliki dompet Tunai bersaldo nol agar bisa langsung mencatat. Google OAuth dan email pemulihan muncul jika penyedianya dikonfigurasi. Sesi memakai cookie HTTP-only.
- PostgreSQL untuk akun dan data tersinkron. Vercel Cron dapat membukukan transaksi berulang setiap hari pukul 08.00 WIB ketika `DATABASE_URL` dan `CRON_SECRET` tersedia.
- Pilih **Gunakan tanpa akun** di `/login` untuk bekerja dengan dompet Tunai kosong. Jika sudah ada catatan lokal, FinTrack membukanya kembali. Catatan lokal disimpan di browser. Jadwal dapat diunduh sebagai `.ics` dan diimpor ke Google Calendar.
- Manifest PWA dan cache shell untuk kunjungan ulang.

## Menjalankan lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Jika ingin memakai **mode demo**, hapus atau kosongkan `DATABASE_URL` dari `.env.local`. Untuk akun yang tersimpan di server, buat database PostgreSQL lalu isi `DATABASE_URL`. Tabel minimal dibuat otomatis pada akses pertama. Isi `CRON_SECRET` dengan string acak yang panjang agar endpoint cron dapat digunakan.

```bash
npm run typecheck
npm test
npm run test:ui
npm run build
```

Untuk PostgreSQL lokal, jalankan `docker compose up -d`, lalu isi `DATABASE_URL=postgresql://fintrack:fintrack_local_only@localhost:5432/fintrack` pada `.env.local`. Sandi di `docker-compose.yml` hanya untuk lingkungan lokal; jangan gunakan pada server.

## Deploy Vercel

1. Gunakan proyek Vercel `fintrack-web` yang telah dibuat. Hubungkan repo GitHub pada pengaturan proyek jika menginginkan deploy otomatis dari Git. Workflow `backend-deploy.yml` juga dapat dijalankan manual setelah variabel GitHub disiapkan.
2. Tambahkan `DATABASE_URL` (PostgreSQL) dan `CRON_SECRET` pada environment **Production** serta **Preview** jika diperlukan. Untuk alur akun lengkap, tambahkan `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, dan `RESET_FROM_EMAIL` sesuai petunjuk di bawah.
3. Jalankan deployment baru. Tanpa `DATABASE_URL`, pilih **Gunakan tanpa akun** untuk mencatat dan mengekspor data dari browser. Halaman masuk mengaktifkan login email setelah PostgreSQL tersambung.
4. Atur backup database dari penyedia PostgreSQL. Endpoint `GET /api/v1/health` menunjukkan status database.

Lihat [`docs/08-devops.md`](docs/08-devops.md) untuk rincian rilis dan rollback.

Alur Git: branch `feature/*` → pull request ke `dev` → uji staging → pull request ke `main` untuk produksi. CI menjalankan typecheck, tes unit, audit, build, tes UI Chromium, dan tes akun, migrasi, serta cron pada PostgreSQL sementara.

## Status terhadap PRD

Implementasi ini mencakup alur inti keuangan pribadi. Penyimpanan akun, migrasi, dan cron diuji dengan PostgreSQL 16 lokal. Login Google dan pengiriman email pemulihan diuji dengan respons penyedia tiruan. Pengaktifan akun di Vercel membutuhkan database terkelola dan kredensial layanan. Kolaborasi dompet keluarga, multi-mata uang, OCR, dan penyimpanan struk di object storage ada di backlog. Struktur data server memakai dokumen JSONB per akun. Rencana untuk skala besar dijelaskan pada [dokumentasi database](docs/05-database.md).

## Referensi

- [PRD asli](docs/reference/PRD.md)
- [Spesifikasi UI/UX asli](docs/reference/UI-UX-Stitch.md)
- [Prompt Codex asli](docs/reference/Codex-master-prompt.md)
- [Ekspor desain Stitch](docs/stitch/)
- Arsip UI Pro Max: panduan aksesibilitas, target sentuh, responsivitas, dan gerak diterapkan pada UI; arsip paket keterampilan tidak dimasukkan ke build aplikasi.

### Google dan pemulihan kata sandi

Untuk mode akun, atur `APP_URL` ke URL publik kanonis aplikasi (misalnya `https://example.com`) dan `DATABASE_URL` ke PostgreSQL. Di Google Cloud, buat OAuth client jenis web, lalu daftarkan redirect URI `APP_URL/api/v1/auth/google/callback` dan atur `GOOGLE_CLIENT_ID` serta `GOOGLE_CLIENT_SECRET`. Email yang sudah terdaftar memakai kata sandi tidak otomatis ditautkan ke akun Google.

Untuk email pemulihan, konfigurasikan `RESEND_API_KEY` dan `RESET_FROM_EMAIL` menggunakan alamat pengirim yang telah diverifikasi di Resend. Nonaktifkan click tracking pada domain pengirim di Resend agar tautan pemulihan tidak ditulis ulang. Tautan berlaku 30 menit dan hanya dapat dipakai sekali; setelah kata sandi diubah, semua sesi akun dicabut. Kegagalan pengiriman dicatat pada log server tanpa alamat atau token. Konfigurasi OAuth, pengiriman email, dan basis data harus diuji pada deployment dengan kredensial nyata sebelum dipakai untuk akun sebenarnya.
