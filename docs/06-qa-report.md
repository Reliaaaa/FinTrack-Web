# Laporan QA — 25 November 2026

## Gate terbaru

| Gate | Hasil | Bukti utama |
| --- | --- | --- |
| `npm run typecheck` | Lulus | TypeScript tanpa error. |
| `npm test` | 13/13 lulus | Validasi data, nominal/saldo, periode, jadwal, batas JSON, dan mock Google/Resend. |
| `npm run build` | Lulus | 21 halaman statis/dinamis dan seluruh route API terbangun. |
| `FINTRACK_TEST_ADMIN_URL=… node --test tests/integration/postgres.test.mjs` | 7/7 lulus | PostgreSQL 16 lokal, database QA acak yang dibuat dan dihapus otomatis. |
| `npm run test:ui` | 7/7 lulus | Chromium lokal; server Next dijalankan tunggal oleh Playwright. |

Tes integrasi menolak URL database di luar localhost dan hanya membuat database bernama `fintrack_qa_<acak>`. Tes memakai `next start` dari build terakhir, lalu menghentikannya dan menghapus database. Tidak ada database QA tersisa sesudah pengujian. Untuk mengulang: jalankan `docker compose up -d postgres`, `npm run build`, lalu `FINTRACK_TEST_ADMIN_URL='postgresql://<user>:<password>@localhost:5432/postgres' node --test tests/integration/postgres.test.mjs`. Role PostgreSQL harus boleh `CREATE DATABASE`.

## Cakupan yang terbukti

- Database nyata: registrasi dua akun, snapshot awal terpisah, simpan dan baca ulang transaksi/dompet/anggaran, isolasi akun, penolakan versi usang dengan `409`, dan penolakan payload akun A memakai cookie akun B dengan `412` tanpa mengubah B.
- Autentikasi: login, logout, token reset sekali pakai, kata sandi lama ditolak, seluruh sesi lama dicabut saat reset, data keuangan tetap ada, dan balapan login/reset tidak meninggalkan sesi dengan kata sandi lama. Token reset dimasukkan langsung sebagai fixture ke database; pengiriman email nyata tidak diuji.
- Browser: tambah/hapus transaksi demo dan reload, anggaran per bulan, tujuh route pada 375 px tanpa overflow, fokus modal kembali setelah Escape, konflik menyimpan draf di `sessionStorage` pada tab yang sama dan tidak membawanya ke tab baru, link reset dengan token di fragment pada 375/1440 px, serta keluar akun lalu masuk demo tanpa membawa data akun ke tampilan atau `localStorage` demo.

Uji manual pada 15 November mencakup tujuh route di lebar 375, 768, 1024, dan 1440 px, filter kategori/tanggal, dompet, tema, ekspor CSV/XLSX, dan shell offline. Rangkaian manual tersebut belum diulang seluruhnya setelah perubahan autentikasi terbaru; hasilnya dicatat sebagai bukti historis, bukan gate rilis terbaru.

## Siklus bug

| ID | Reproduksi | Keparahan | Status dan uji ulang |
| --- | --- | --- | --- |
| QA-01 | Buka Laporan/Tagihan di 375 px atau Dasbor di 768 px; konten melebar 1–9 px. | P1 | Ditutup; perbaikan layout dan smoke tujuh route mobile lulus. |
| QA-02 | Putuskan jaringan saat bootstrap; aplikasi masuk demo tanpa penjelasan. | P1 | Ditutup; banner menyatakan server tidak tersedia dan perubahan demo tidak tersinkron. |
| QA-03 | Cookie sesi akun B dipakai tab dengan snapshot A lalu `PUT /data`. | P1 | Ditutup di API; `accountId` tidak cocok menghasilkan `412`, snapshot B tidak berubah pada DB nyata. |
| QA-04 | Keluar dari akun saat belum ada data demo, lalu pilih “Jelajahi mode demo”. | P1 | Ditutup; tes Chromium membuktikan data A hilang dari UI dan tidak disalin ke `localStorage` demo. |

## Batas pengujian

PostgreSQL yang diuji adalah container lokal, bukan database produksi. Google OAuth dan Resend hanya diuji dengan mock; kredensial/provider nyata dan pengiriman email belum diuji. Uji browser terbaru memakai Chromium saja, dan sebagian besar pemeriksaan responsif otomatis berada pada 375 px. Belum ada audit aksesibilitas menyeluruh, pengukuran Lighthouse/Core Web Vitals, pengujian beban data besar, atau uji pemulihan backup. Implementasi masih memakai snapshot JSONB per akun, bukan CRUD granular dan paginasi server yang dijelaskan dalam PRD.
