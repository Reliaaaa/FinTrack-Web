# Backlog fitur FinTrack Web

Sumber: [PRD](reference/PRD.md) dan kode pada `src/` per 25 November 2026. Setiap baris dirancang sebagai pekerjaan satu pengembang selama 1–3 hari. **Ada di kode** berarti implementasi terlihat, bukan sudah tervalidasi di PostgreSQL produksi. **Parsial** berarti hanya sebagian kriteria selesai yang terpenuhi.

## P0 — fondasi dan fitur wajib

| ID | Fitur satu kalimat | Bergantung pada | Kriteria selesai | Status saat ini |
| --- | --- | --- | --- | --- |
| P0-01 | Daftarkan akun dengan email dan kata sandi. | Database | Email unik, hash bcrypt, validasi, dan sesi baru teruji pada PostgreSQL. | Lulus pada PostgreSQL 16 lokal. |
| P0-02 | Masuk dan keluar dengan sesi web yang aman. | P0-01 | Cookie HTTP-only/Secure/SameSite, token kedaluwarsa, login salah dibatasi, logout mencabut sesi. | Lulus pada PostgreSQL 16 lokal. |
| P0-03 | Masuk melalui Google OAuth. | P0-01, kredensial Google | OAuth memverifikasi identitas, membuat akun Google atau menghubungkannya secara aman, lalu mengelola sesi. | Ada di kode: akun Google baru dibuat; email akun kata sandi yang sama tidak otomatis ditautkan. Butuh `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan uji provider nyata. |
| P0-04 | Pulihkan kata sandi melalui email. | P0-01, penyedia email | Token sekali pakai kedaluwarsa, email terkirim, kata sandi baru mengakhiri sesi lama. | Ada di kode: token 30 menit dan sesi lama dicabut. Butuh `APP_URL`, `RESEND_API_KEY`, `RESET_FROM_EMAIL` terverifikasi, dan uji pengiriman nyata. |
| P0-05 | Lindungi data tiap pengguna pada API dan rute aplikasi. | P0-02 | Pengguna tanpa sesi ditolak; pengguna A tidak bisa membaca/mengubah data B; tes otorisasi lulus. | Isolasi dua akun, perubahan sesi lintas tab, dan penolakan snapshot akun lama diuji. |
| P0-06 | Tambah, ubah, dan arsipkan dompet bank, e-wallet, tunai, serta kartu kredit. | P0-05 | Saldo awal, jenis, nama, dan status arsip tersimpan; dompet yang dipakai transaksi tidak terhapus. | Ada di kode dan demo. |
| P0-07 | Hitung saldo dompet dari pemasukan, pengeluaran, dan transfer. | P0-06 | Total kekayaan tetap sama saat transfer; edit/hapus transaksi mengubah saldo tepat sekali. | Ada di kode; tes transfer lulus. |
| P0-08 | Catat, ubah, dan hapus pemasukan serta pengeluaran. | P0-06 | Nominal positif, dompet, kategori, tanggal, judul, catatan tervalidasi dan tersimpan. | Ada di demo dan penyimpanan akun diuji pada PostgreSQL 16 lokal. |
| P0-09 | Catat transfer antar-dompet. | P0-07 | Dompet asal/tujuan berbeda, sumber berkurang, tujuan bertambah, total tidak berubah. | Ada di kode; tes perhitungan lulus. |
| P0-10 | Cari dan filter buku besar transaksi. | P0-08 | Cari teks/nominal dan filter tanggal, dompet, kategori, tipe dengan hasil serta paginasi akurat. | Parsial: seluruh filter dan paginasi bekerja di browser; paginasi server belum ada. |
| P0-11 | Atur pagu pengeluaran per kategori dan bulan. | P0-08 | Pagu terpisah per bulan/tahun, dapat diubah/dihapus, tidak mencampur periode. | Ada di kode; pagu mengikuti bulan terpilih dan alur UI diuji. |
| P0-12 | Tampilkan progres dan peringatan anggaran. | P0-11 | Progres memakai transaksi periode terpilih, warna serta teks peringatan muncul pada ≥80% dan ≥100%. | Ada di kode; progres memakai pagu bulan terpilih. |
| P0-13 | Tampilkan ringkasan dasbor dan grafik arus kas. | P0-07, P0-08 | Empat KPI, pemasukan/pengeluaran enam bulan, distribusi kategori, dan transaksi terbaru mengikuti data. | Ada di kode dan demo; tren kekayaan bersih khusus belum ada. |
| P0-14 | Sediakan navigasi desktop dan mobile yang dapat diakses. | Desain UI | Sidebar, navigasi bawah, modal, label form, fokus keyboard, dan reduced motion bekerja di layar kecil/besar. | Ada di kode; uji aksesibilitas menyeluruh belum ada. |
| P0-15 | Validasi penyimpanan akun pada PostgreSQL produksi. | P0-01–P0-13, kredensial DB | Register → catat → reload → login ulang → verifikasi saldo dan isolasi akun lulus. | Alur akun lulus pada PostgreSQL lokal. `DATABASE_URL` untuk Vercel masih perlu disambungkan. |

## P1 — pelengkap utama

| ID | Fitur satu kalimat | Bergantung pada | Kriteria selesai | Status saat ini |
| --- | --- | --- | --- | --- |
| P1-01 | Buat, ubah, jeda, dan hapus jadwal transaksi rutin. | P0-06, P0-08 | Jadwal menyimpan dompet, nominal, kategori, frekuensi, tanggal berikutnya, status aktif. | Ada di kode dan demo. |
| P1-02 | Bukukan jadwal aktif secara otomatis dan idempoten. | P1-01, P0-15, `CRON_SECRET` | Cron terotentikasi membuat tepat satu transaksi per tanggal, memajukan jadwal, aman saat dijalankan ulang. | Lulus uji idempotensi pada PostgreSQL 16 lokal. |
| P1-03 | Ekspor transaksi ke CSV, XLSX, dan PDF. | P0-08 | Berkas CSV/XLSX terbuka benar; PDF melalui cetak berisi periode yang dipilih. | Ada di kode; validasi berkas XLSX/PDF akhir belum dicatat. |
| P1-04 | Impor transaksi dari CSV/XLSX. | P0-08 | Pratinjau kolom, validasi baris, penanganan duplikat, dan hasil impor jelas. | Belum. |
| P1-05 | Unggah, lihat, dan hapus struk transaksi. | P0-08 | Pratinjau aman, batas ukuran/format, penyimpanan object storage, dan akses terbatas pemilik. | Parsial: input gambar ≤1 MB disimpan dalam data; pratinjau dan object storage belum ada. |
| P1-06 | Buat aplikasi web dapat dipasang dan mengakses shell terakhir secara offline. | P0-14 | Manifest, ikon, service worker, dan pengujian instalasi/offline lulus. | Parsial: manifest, ikon, cache shell ada; uji instalasi/offline belum ada. |
| P1-07 | Beri opsi tema gelap dengan kontras memadai. | P0-14 | Tema tersimpan, semua halaman/form/grafik dapat dibaca, cek kontras lulus. | Ada di kode; audit kontras belum ada. |
| P1-08 | Tampilkan laporan tren kekayaan bersih. | P0-13 | Grafik saldo bersih berdasarkan transaksi historis, periode dapat dipilih. | Belum. |
| P1-09 | Siapkan sinkronisasi dan data besar. | P0-15 | Konflik dua tab terdeteksi; API transaksi berpaginasi server; indeks serta backup tervalidasi. | Parsial: optimistic concurrency mendeteksi konflik dan menjaga draf lokal; paginasi server, indeks transaksi, dan backup belum ada. |
| P1-10 | Pasang pemantauan kualitas rilis. | P0-15 | CI typecheck/test/build hijau, uji browser dan kesehatan server terdokumentasi, target performa PRD diukur. | Parsial: tes/build lokal lulus; metrik produksi dan CI belum diverifikasi. |

## P2 — perluasan setelah inti stabil

| ID | Fitur satu kalimat | Bergantung pada | Kriteria selesai | Status saat ini |
| --- | --- | --- | --- | --- |
| P2-01 | Undang anggota ke dompet keluarga. | P0-15, email | Undangan aman terkirim/diterima dan hanya berlaku untuk dompet tujuan. | Belum. |
| P2-02 | Terapkan izin Viewer dan Editor pada dompet bersama. | P2-01 | API menolak penulisan Viewer dan akses non-anggota; tes otorisasi lulus. | Belum. |
| P2-03 | Catat audit trail perubahan dompet bersama. | P2-02 | Setiap perubahan menyimpan pelaku, aksi, waktu, dan dapat dilihat anggota berizin. | Belum. |
| P2-04 | Catat beberapa mata uang dan kurs. | P0-07 | Mata uang tiap dompet/entri jelas, konversi berkurs bertanggal, pembulatan konsisten. | Belum. |
| P2-05 | Baca nominal/tanggal dari foto struk dengan OCR. | P1-05 | Hasil OCR ditinjau pengguna sebelum mencatat transaksi; kesalahan tidak otomatis dibukukan. | Belum. |
| P2-06 | Sediakan panel admin operasional. | P0-15 | Izin admin, statistik layanan, kategori bawaan, dan status akun dibatasi/teruji. | Belum. |

Di luar rilis pertama sesuai PRD: integrasi mutasi bank otomatis dan harga kripto/saham langsung.

## Urutan rilis

1. **Demo UI:** P0-06–P0-14 dalam mode lokal, agar interaksi dan desain dapat ditinjau.
2. **MVP akun pribadi:** P0-01–P0-15 lengkap setelah Google OAuth dan reset kata sandi diuji dengan provider nyata, isolasi data diuji, dan alur PostgreSQL nyata lulus.
3. **Operasional pribadi:** P1-01–P1-10, termasuk cron, impor/ekspor, struk cloud, offline, CI, performa, dan backup.
4. **Keluarga dan fitur lanjut:** P2-01–P2-06 sesudah keamanan serta sinkronisasi akun stabil.
