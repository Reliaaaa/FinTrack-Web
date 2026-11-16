# FinTrack Web

Aplikasi pencatat keuangan pribadi berbahasa Indonesia. Dibangun dengan Next.js, React, TypeScript, PostgreSQL, dan Recharts. Antarmuka mengikuti spesifikasi UI dan enam layar ekspor Google Stitch yang disertakan di [`docs/`](docs/). Animasi dibuat ringan, menghormati preferensi **reduced motion**, dan mengambil prinsip transisi dari [LandingPageReliaaaa](https://github.com/Reliaaaa/LandingPageReliaaaa), tanpa menyalin aset atau kode repositori tersebut.

![Dasbor FinTrack Web](docs/dashboard-desktop.png)

## Fitur yang tersedia

- Dasbor responsif dengan arus kas enam bulan, distribusi pengeluaran, status anggaran, dan transaksi terbaru.
- CRUD transaksi pemasukan, pengeluaran, dan transfer. Saldo dompet dihitung dari saldo awal dan transaksi agar transfer tidak menggandakan kekayaan bersih.
- CRUD dompet, arsip dompet, anggaran per kategori, jadwal berulang, dan pengaturan tema.
- Pencarian, filter, dan paginasi transaksi; ekspor CSV dan XLSX; PDF melalui dialog cetak browser.
- Lampiran foto struk PNG/JPEG/WebP hingga 1 MB pada transaksi.
- Registrasi dan login email dengan hash bcrypt, sesi cookie HTTP-only, pembatasan percobaan login, dan pemeriksaan Origin pada penulisan API.
- PostgreSQL untuk akun dan data tersinkron. Vercel Cron dapat membukukan transaksi berulang setiap hari pukul 08.00 WIB ketika `DATABASE_URL` dan `CRON_SECRET` tersedia.
- Mode demo tanpa database: data contoh dan perubahan tersimpan pada localStorage browser. Jadwal dapat diunduh sebagai `.ics` dan diimpor ke Google Calendar; ekspor bulanan memuat 10 tahun tanggal, ekspor tahunan 40 tahun.
- Manifest PWA dan cache shell untuk kunjungan ulang.

## Menjalankan lokal

```bash
npm install
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
2. Tambahkan `DATABASE_URL` (PostgreSQL) dan `CRON_SECRET` pada environment **Production** serta **Preview** jika diperlukan.
3. Jalankan deployment baru. Tanpa `DATABASE_URL`, situs tetap berfungsi sebagai demo lokal browser, tetapi **tidak menyediakan akun atau sinkronisasi perangkat**.
4. Atur backup database dari penyedia PostgreSQL. Endpoint `GET /api/v1/health` menunjukkan status database.

Lihat [`docs/08-devops.md`](docs/08-devops.md) untuk rincian rilis dan rollback.

Alur Git: branch `feature/*` → pull request ke `dev` → uji staging → pull request ke `main` untuk produksi. CI pada PR menjalankan typecheck, tes unit, audit dependensi, build, dan tes UI Chromium. Kode yang belum lolos pemeriksaan tetap berada di branch fitur.

## Status terhadap PRD

Implementasi ini mencakup alur inti keuangan pribadi. Integrasi Google OAuth, reset kata sandi lewat email, kolaborasi dompet keluarga, multi-mata uang, OCR, dan penyimpanan struk di object storage belum disediakan. Struktur data server masih berupa dokumen JSONB per pengguna; migrasi ke tabel transaksi dan indeks untuk skala besar dibahas di [`docs/05-database.md`](docs/05-database.md). Jangan gunakan mode demo untuk data keuangan penting.

## Referensi

- [PRD asli](docs/reference/PRD.md)
- [Spesifikasi UI/UX asli](docs/reference/UI-UX-Stitch.md)
- [Prompt Codex asli](docs/reference/Codex-master-prompt.md)
- [Ekspor desain Stitch](docs/stitch/)
- Arsip UI Pro Max: panduan aksesibilitas, target sentuh, responsivitas, dan gerak diterapkan pada UI; arsip paket keterampilan tidak dimasukkan ke build aplikasi.
