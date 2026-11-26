# Desain FinTrack Web

Dokumen ini memetakan UI FinTrack dan state yang diperlukan untuk menuntaskan fitur P0. Acuan visual: [spesifikasi UI/UX](reference/UI-UX-Stitch.md) dan [enam layar ekspor Stitch](stitch/).

## Peta navigasi

```text
/login ── Masuk / Daftar ──> Dasbor akun
  ├── Gunakan tanpa akun ──> Dasbor lokal
  ├── Lanjutkan dengan Google ── OAuth callback ──> Dasbor
  └── Lupa kata sandi ── email tautan ──> /reset ──> Login
                            ├── Transaksi ──> Tambah / Ubah Transaksi
                            ├── Dompet ──> Tambah / Ubah Dompet
                            ├── Investasi ──> Simpanan / Setor / Tarik
                            ├── Anggaran ──> Tambah / Ubah Anggaran
                            ├── Tagihan Berulang ──> Tambah / Ubah Jadwal
                            ├── Laporan ──> Ekspor / Cetak
                            └── Pengaturan ──> Profil / Tema / Data
```

Dock mengambang di tengah bagian bawah. Pada desktop, delapan menu dan tombol **Catat Transaksi** tampil di dock. Hingga lebar 800 px, dock menampilkan Dasbor, Transaksi, Anggaran, Investasi, Dompet, dan **Lainnya**. Menu **Lainnya** memuat Tagihan Berulang, Laporan, Pengaturan, dan panduan. Tombol tambah berada di atas dock pada layar sempit. Header memuat identitas FinTrack, pilihan bulan, pintasan pencarian, dan pengaturan tema.

## Tata letak dock

| Layar | Konten | Navigasi |
| --- | --- | --- |
| Desktop | Header dan konten terpusat memanfaatkan lebar layar. | Dock kaca tetap di bagian bawah dengan semua menu dan aksi catat. |
| Tablet dan ponsel hingga 800 px | Header menampilkan pencarian sebagai ikon. | Lima menu utama tetap terlihat. Menu Lainnya terbuka ke atas, dan tombol tambah mengambang di atas dock. |

## State layar P0

| Layar / fitur | Tujuan dan komponen utama | Loading | Kosong | Error | Sukses |
| --- | --- | --- | --- | --- | --- |
| Login/Daftar | `/login` dapat dibuka dari dasbor. Saat akun online tersedia, form berisi email, kata sandi, dan nama untuk pendaftaran. Google dan pemulihan mengikuti konfigurasi. | Tombol “Memproses…” dinonaktifkan | Saat PostgreSQL belum tersambung, halaman menampilkan tombol “Gunakan tanpa akun” | Pesan dekat form untuk kredensial, validasi, atau layanan yang tidak tersedia | Masuk menuju dasbor akun. Mode lokal membuka catatan yang tersimpan atau menyiapkan dompet Tunai kosong. |
| Reset kata sandi | Tautan email membuka `/reset` dan form kata sandi baru | Tombol “Memproses…” dinonaktifkan | Token hilang membuat tombol simpan nonaktif | Token salah/kedaluwarsa atau kegagalan server ditampilkan | Pesan berhasil dan tautan kembali ke login |
| Proteksi akun | Memisahkan data demo dari akun serta menolak sesi hilang | Layar “Menyiapkan FinTrack…” | Akun baru menampilkan daftar kosong setelah login | Sesi hilang membuka form login; error database tampak pada banner demo | Data akun tampil setelah bootstrap |
| Dasbor | Empat KPI, grafik enam bulan, donat kategori, anggaran, transaksi terakhir | Layar persiapan saat bootstrap | Donat dan anggaran memiliki pesan serta ajakan mencatat/atur; transaksi baru belum memiliki empty state tersendiri | Banner server saat bootstrap gagal | Angka, grafik, dan daftar mengikuti perubahan data |
| Dompet | Total saldo, kartu per dompet, tambah/ubah/arsip/hapus | Bersama bootstrap; indikator “Menyimpan…” saat penulisan akun | Kartu “Tambah Dompet Baru” | Hapus dompet yang masih dipakai ditolak lewat toast | Toast; saldo dan ringkasan berubah |
| Transaksi | Pencarian, filter dompet/tipe/kategori/rentang tanggal, tabel, paginasi, form pemasukan/pengeluaran/transfer | Bersama bootstrap; tombol simpan nonaktif dan bertuliskan “Menyimpan…” saat penulisan akun | Pesan dan tombol Catat Transaksi | Nominal nol, dompet transfer sama, dan kegagalan simpan ditampilkan; konfirmasi hapus native | Toast; tabel, saldo, dan grafik diperbarui |
| Anggaran | Ringkasan pagu/terpakai/sisa untuk bulan pilihan, kartu progres per kategori | Bersama bootstrap; indikator “Menyimpan…” saat penulisan akun | Ajakan membuat anggaran pada bulan yang dipilih | Pagu nol atau kategori ganda **pada bulan yang sama** ditolak dekat form; simpan server gagal ditampilkan lewat toast | Pagu menyimpan periode `YYYY-MM`; badge “Terkendali”, “Mendekati batas”, “Melebihi batas” serta toast |
| Navigasi responsif | Header, dock mengambang, dan modal | Tidak relevan | Tidak relevan | Halaman URL tak dikenal memberi 404 | Tab aktif, URL, dan browser Back selaras |
| Konflik perubahan akun | Banner konflik menyediakan unduh draf lokal dan muat data server terbaru | Tombol simpan diblokir selama konflik | Tidak muncul tanpa konflik | Pesan `role="alert"` menerangkan bahwa draf lokal tersimpan | Draf diunduh sebelum data terbaru dimuat |

Alur UI Google OAuth, lupa kata sandi, dan reset sudah tersedia, tetapi perlu pengujian dengan Google, Resend, dan PostgreSQL nyata sebelum dinyatakan selesai. Paginasi transaksi masih di browser. Form menampilkan status penulisan akun, mengembalikan kesalahan simpan melalui toast, dan melakukan rollback bila jaringan/server gagal. Filter tanggal dan kategori serta pagu khusus tiap bulan sudah tersedia.

## Aturan visual di CSS

Gunakan [`globals.css`](../src/app/globals.css) sebagai acuan. Tema gelap mengganti nilai token warna melalui `data-theme="dark"`; komponen memakai token yang sama di kedua tema.

| Token CSS | Terang | Gelap | Pemakaian |
| --- | --- | --- | --- | --- |
| `--bg` | `#EDF5EE` | `#051F20` | Latar aplikasi |
| `--surface` | `#FFFFFF` | `#0B2B26` | Kartu, header, tabel, dan modal |
| `--ink` | `#0B2B26` | `#DAF1DE` | Teks utama dan nominal |
| `--muted` | `#49685E` | `#A1BFB1` | Keterangan, label grafik, dan isi sekunder |
| `--line` | `#D6E6DA` | `#2C5248` | Garis tepi dan pemisah |
| `--green` / `--green-soft` | `#235347` / `#DAF1DE` | `#A8D2B2` / `#163832` | Aksi dan pemasukan |
| `--rose` / `--rose-soft` | `#A83D58` / `#FAEAF0` | `#F4A5B8` / `#492A38` | Pengeluaran dan bahaya |
| `--amber` / `--amber-soft` | `#8C5117` / `#FDF1DE` | `#EDC982` / `#453A24` | Anggaran dan peringatan |
| `--blue` / `--blue-soft` | `#356459` / `#E7F2EC` | `#A7CEBF` / `#163832` | Transfer dan informasi |
| `--focus` | `#18735E` | `#A8D2B2` | Ring fokus dan tepi kontrol aktif |

| Aturan | Nilai dan penerapan |
| --- | --- |
| Tipografi | Label dan keterangan yang dipakai bersama menggunakan 12 px, teks kecil 13 px, dan isi 14 px. Judul halaman mengikuti lebar layar dari 24 sampai 32 px. Judul Dasbor dari 26 sampai 40 px. |
| Jarak dan bentuk | Langkah jarak yang dipakai adalah 8, 12, 16, 20, dan 24 px. Margin horizontal 16 sampai 34 px, jarak kartu 12 sampai 22 px, radius kartu 16 px, dan radius kontrol 10 px. |
| Desktop | Empat kartu ringkasan dan dua kartu saldo. Grafik arus kas mendapat kolom lebih lebar dari grafik kategori. Dock berada di bawah konten. |
| Tablet | Hingga 900 px, pencarian tampil sebagai ikon dan kartu ringkasan menjadi dua kolom. Hingga 800 px, menu tambahan masuk ke Lainnya. |
| Ponsel | Hingga 700 px, grafik dan panel bawah menjadi satu kolom, legenda kategori membungkus nama panjang, dan konten menyisakan ruang untuk dock serta tombol tambah. Kontrol header berukuran 44 px dan ukuran teks input sedikitnya 16 px. Hingga 500 px, kontrol periode mendapat baris sendiri bersama aksi header. |
| Tabel dan grafik | Tabel bergulir di dalam panel pada layar sempit. Label sumbu memakai `rb` dan `jt` sesuai nominal. Warna grafik disertai legenda, sedangkan nilai lengkap tersedia pada tooltip arus kas. |
| Fokus dan gerakan | Tampilkan fokus keyboard pada kontrol dan gunakan preferensi reduced motion untuk animasi. |

Tipografi mengikuti SF Pro Display dari [LandingPageReliaaaa](https://github.com/Reliaaaa/LandingPageReliaaaa). FinTrack memilih SF Pro bawaan perangkat Apple dan memakai Inter atau font sistem pada perangkat lain. Berkas font Apple tidak disematkan karena [lisensinya](https://developer.apple.com/fonts/) membatasi penggunaan dan distribusi. Angka memakai `tabular-nums` dan nominal diformat dengan `Intl.NumberFormat('id-ID')`.

Pengguliran roda mouse memakai Lenis, dengan scrollbar badan halaman dari OverlayScrollbars. Inisialisasinya diadaptasi dari [smooth-scroll.js](https://github.com/Reliaaaa/Internship-BEM-Website-Project/blob/b6d5abe73e9411591bb7380bd204252dd65906a1/smooth-scroll.js) dan [scrollbar.js](https://github.com/Reliaaaa/Internship-BEM-Website-Project/blob/b6d5abe73e9411591bb7380bd204252dd65906a1/scrollbar.js). Sentuhan dan area gulir di modal tetap memakai kontrol browser. Pengaturan pengurangan gerakan mematikan Lenis dan animasi antarmuka.

Gaya dock ada di [floating-dock.css](../src/app/floating-dock.css). Permukaan semi-transparan, blur latar, dan sorotan tepi mengikuti tema. Jika blur tidak tersedia, dock memakai warna permukaan solid. Jarak bawah mengikuti area aman ponsel dan dock disembunyikan saat mencetak laporan.

## Aksesibilitas dan kontrol kualitas

- Form memakai label terlihat; elemen ikon tunggal diberi nama aksesibel. Fokus keyboard memakai ring emerald. Saat modal dibuka, fokus masuk ke field pertama; Tab/Shift+Tab tetap berada di dialog; Escape atau klik backdrop menutupnya dan fokus kembali ke pemicu. Warna status selalu didampingi teks/angka; donat memiliki `aria-label` berisi nilai setiap kategori.
- Navigasi ponsel memiliki area minimal 44 px. Tabel transaksi dapat digulir horizontal pada layar kecil; daftar kartu khusus mobile sesuai PRD belum dibuat. Pastikan fokus tidak tertutup navigasi bawah dan modal saat pemeriksaan berikutnya.
- **Perlu diperiksa sebelum P0 dinyatakan selesai:** menu mobile belum diuji menyeluruh dengan keyboard/pembaca layar; kontras teks kecil serta grafik tema gelap belum diaudit secara terukur. Audit pada 375, 768, 1024, dan 1440 px serta zoom 200% masih perlu dicatat.
