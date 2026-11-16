# Laporan QA — 15 November 2026

## Gate otomatis

- `npm run typecheck`: lulus.
- `npm test`: 8/8 lulus. Cakupan: transfer tidak mengubah kekayaan bersih, ringkasan sesuai bulan, tanggal berulang akhir bulan, validasi data API, anggaran terpisah per bulan, dan batas body JSON tanpa `Content-Length`.
- `npm run build`: lulus; semua route aplikasi dan API terbangun.
- `npm run test:ui`: 3/3 lulus di Chromium. Tes otomatis mencakup tambah/hapus transaksi dan ketahanan setelah reload, anggaran per bulan, tujuh route mobile 375 px tanpa overflow, dan pemulihan fokus modal.

## Uji browser tambahan

Semua tujuh route dibuka langsung pada lebar 375, 768, 1024, dan 1440 px, tanpa error JavaScript. Transaksi tambah/ubah/hapus, tambah dompet, tambah jadwal berulang, filter kategori, ekspor CSV dan XLSX, tema gelap yang bertahan setelah reload, serta modal keyboard diuji secara interaktif. File XLSX terunduh dan struktur ZIP-nya tervalidasi. Pada mode offline dengan service worker, shell tetap terbuka dan menampilkan peringatan jelas bahwa data berada di mode demo lokal.

Simulasi respons server `500` membuktikan modal tetap terbuka dan input transaksi tetap ada. Simulasi konflik `409` setelah perubahan keamanan membuktikan draf tersimpan di `sessionStorage` per ID akun, tetap ada setelah reload pada tab yang sama, dan tidak muncul pada tab baru setelah tab asal ditutup.

## Siklus bug

| ID | Reproduksi | Keparahan | Perbaikan | Uji ulang |
| --- | --- | --- | --- | --- |
| QA-01 | Buka Laporan/Tagihan di 375 px atau Dasbor di 768 px; konten melebar 1–9 px. | P1 | Header sempit dan daftar transaksi dibatasi ke lebar viewport. | Lulus pada empat breakpoint dan seluruh route. |
| QA-02 | Putuskan jaringan saat `GET /api/v1/bootstrap`; aplikasi masuk mode demo tanpa alasan koneksi terlihat. | P1 | Banner kini menyatakan server tidak tersedia dan perubahan lokal tidak tersinkron. | Lulus dengan intersepsi jaringan dan reload offline. |

Siklus uji ulang penuh untuk cakupan di atas tidak menemukan bug P0/P1 baru. Ini **bukan** pernyataan bahwa semua fitur P0/P1 PRD telah selesai.

## Batas pengujian

PostgreSQL nyata tidak tersedia dalam workspace ini. Registrasi/login, migrasi, otorisasi antar-pengguna, pembukuan cron, dan konflik versi SQL belum diuji end-to-end pada database. Belum ada pengukuran Lighthouse/Core Web Vitals, audit aksesibilitas menyeluruh, atau uji beban data besar. Google OAuth dan reset kata sandi masih belum diimplementasikan.
