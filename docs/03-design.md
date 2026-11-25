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
                            ├── Anggaran ──> Tambah / Ubah Anggaran
                            ├── Tagihan Berulang ──> Tambah / Ubah Jadwal
                            ├── Laporan ──> Ekspor / Cetak
                            └── Pengaturan ──> Profil / Tema / Data
```

Pada desktop, sidebar tetap berisi tujuh tujuan dan tombol **Catat Transaksi**. Header memuat bulan pilihan, pintasan pencarian yang menuju Transaksi, tema, dan indikator anggaran. Pada lebar ≤900 px, menu utama dapat dibuka dari header; pada ≤700 px, navigasi bawah menyediakan Dasbor, Transaksi, Anggaran, Dompet, serta tombol tambah mengambang. Laporan, Jadwal, dan Pengaturan tetap dapat dicapai lewat menu header. URL `/transactions`, `/wallets`, `/budgets`, `/recurring`, `/reports`, `/settings` dapat dibuka langsung.

## Wireframe teks

```text
DESKTOP                                      MOBILE
┌─────────────┬──────────────────────────┐  ┌───────────────────┐
│ FinTrack    │ Header: periode / tema   │  │ Menu / Judul / Bulan│
│ + Catat     ├──────────────────────────┤  ├───────────────────┤
│ Dasbor      │ Judul + aksi             │  │ Judul + aksi       │
│ Transaksi   │ KPI  KPI  KPI  KPI       │  │ KPI       KPI      │
│ Dompet      │ Arus kas   │ Donat       │  │ KPI       KPI      │
│ Anggaran    │ Anggaran   │ Transaksi   │  │ Arus kas           │
│ Jadwal      │            │ terbaru     │  │ Donat / Anggaran   │
│ Laporan     │            │             │  │ Transaksi terbaru  │
│ Pengaturan  │            │             │  ├───────────────────┤
└─────────────┴──────────────────────────┘  │ Dasbor Trans + ...│
                                           └───────────────────┘
```

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
| Navigasi responsif | Sidebar, header, bottom nav, modal | Tidak relevan | Tidak relevan | Halaman URL tak dikenal memberi 404 | Tab aktif, URL, dan browser Back selaras |
| Konflik perubahan akun | Banner konflik menyediakan unduh draf lokal dan muat data server terbaru | Tombol simpan diblokir selama konflik | Tidak muncul tanpa konflik | Pesan `role="alert"` menerangkan bahwa draf lokal tersimpan | Draf diunduh sebelum data terbaru dimuat |

Alur UI Google OAuth, lupa kata sandi, dan reset sudah tersedia, tetapi perlu pengujian dengan Google, Resend, dan PostgreSQL nyata sebelum dinyatakan selesai. Paginasi transaksi masih di browser. Form menampilkan status penulisan akun, mengembalikan kesalahan simpan melalui toast, dan melakukan rollback bila jaringan/server gagal. Filter tanggal dan kategori serta pagu khusus tiap bulan sudah tersedia.

## Token dan komponen

| Token | Light | Dark | Kegunaan |
| --- | --- | --- | --- |
| Latar | `#F8FAFC` | `#090D16` | Kanvas |
| Surface | `#FFFFFF` | `#111827` | Kartu/modal/sidebar |
| Border | `#E2E8F0` | `#293448` | Pemisah ringan |
| Teks | `#0F172A` | `#F8FAFC` | Konten utama |
| Emerald | `#059669` | `#34D399` | Pemasukan, aksi aktif |
| Rose | `#E11D48` | `#FB7185` | Pengeluaran, bahaya |
| Amber | `#B45309` | `#FBBF24` | Anggaran mendekati batas |
| Blue | `#2563EB` | `#60A5FA` | Transfer, bantuan |

Tipografi mengikuti SF Pro Display dari [LandingPageReliaaaa](https://github.com/Reliaaaa/LandingPageReliaaaa). FinTrack memilih SF Pro bawaan perangkat Apple dan memakai Inter atau font sistem pada perangkat lain. Berkas font Apple tidak disematkan karena [lisensinya](https://developer.apple.com/fonts/) membatasi penggunaan dan distribusi. Angka memakai `tabular-nums` dan nominal diformat dengan `Intl.NumberFormat('id-ID')`.

Pengguliran roda mouse memakai Lenis, dengan scrollbar badan halaman dari OverlayScrollbars. Inisialisasinya diadaptasi dari [smooth-scroll.js](https://github.com/Reliaaaa/Internship-BEM-Website-Project/blob/b6d5abe73e9411591bb7380bd204252dd65906a1/smooth-scroll.js) dan [scrollbar.js](https://github.com/Reliaaaa/Internship-BEM-Website-Project/blob/b6d5abe73e9411591bb7380bd204252dd65906a1/scrollbar.js). Sentuhan dan area gulir di modal tetap memakai kontrol browser. Pengaturan pengurangan gerakan mematikan Lenis dan animasi antarmuka.

## Aksesibilitas dan kontrol kualitas

- Form memakai label terlihat; elemen ikon tunggal diberi nama aksesibel. Fokus keyboard memakai ring emerald. Saat modal dibuka, fokus masuk ke field pertama; Tab/Shift+Tab tetap berada di dialog; Escape atau klik backdrop menutupnya dan fokus kembali ke pemicu. Warna status selalu didampingi teks/angka; donat memiliki `aria-label` berisi nilai setiap kategori.
- Navigasi ponsel memiliki area minimal 44 px. Tabel transaksi dapat digulir horizontal pada layar kecil; daftar kartu khusus mobile sesuai PRD belum dibuat. Pastikan fokus tidak tertutup navigasi bawah dan modal saat pemeriksaan berikutnya.
- **Perlu diperiksa sebelum P0 dinyatakan selesai:** menu mobile belum diuji menyeluruh dengan keyboard/pembaca layar; kontras teks kecil serta grafik tema gelap belum diaudit secara terukur. Audit pada 375, 768, 1024, dan 1440 px serta zoom 200% masih perlu dicatat.
