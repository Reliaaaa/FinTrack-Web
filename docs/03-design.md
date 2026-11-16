# Desain FinTrack Web

Dokumen ini memetakan UI yang **sudah ada** pada 16 November 2026 dan state yang diperlukan untuk menuntaskan fitur P0. Acuan visual: [spesifikasi UI/UX](reference/UI-UX-Stitch.md) dan [enam layar ekspor Stitch](stitch/stitch_fintrack_finance_dashboard/). Canva tidak tersambung; wireframe di bawah ini berupa teks, bukan tautan desain Canva.

## Peta navigasi

```text
Login / Daftar ── berhasil ──> Dasbor
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
| Login/Daftar | Email, kata sandi, nama saat daftar, tombol masuk/daftar, tautan mode demo | Tombol “Memproses…” dinonaktifkan | Tidak relevan | Pesan dekat form untuk kredensial/validasi; saat database gagal, aplikasi memberi pesan server tidak tersedia | Masuk ke dasbor dengan data akun |
| Proteksi akun | Memisahkan data demo dari akun serta menolak sesi hilang | Layar “Menyiapkan FinTrack…” | Akun baru menampilkan daftar kosong setelah login | Sesi hilang membuka form login; error database tampak pada banner demo | Data akun tampil setelah bootstrap |
| Dasbor | Empat KPI, grafik enam bulan, donat kategori, anggaran, transaksi terakhir | Layar persiapan saat bootstrap | Donat dan anggaran memiliki pesan serta ajakan mencatat/atur; transaksi baru belum memiliki empty state tersendiri | Banner server saat bootstrap gagal | Angka, grafik, dan daftar mengikuti perubahan data |
| Dompet | Total saldo, kartu per dompet, tambah/ubah/arsip/hapus | Bersama bootstrap; indikator “Menyimpan…” saat penulisan akun | Kartu “Tambah Dompet Baru” | Hapus dompet yang masih dipakai ditolak lewat toast | Toast; saldo dan ringkasan berubah |
| Transaksi | Pencarian, filter dompet/tipe/kategori/rentang tanggal, tabel, paginasi, form pemasukan/pengeluaran/transfer | Bersama bootstrap; tombol simpan nonaktif dan bertuliskan “Menyimpan…” saat penulisan akun | Pesan dan tombol Catat Transaksi | Nominal nol, dompet transfer sama, dan kegagalan simpan ditampilkan; konfirmasi hapus native | Toast; tabel, saldo, dan grafik diperbarui |
| Anggaran | Ringkasan pagu/terpakai/sisa untuk bulan pilihan, kartu progres per kategori | Bersama bootstrap; indikator “Menyimpan…” saat penulisan akun | Ajakan membuat anggaran pada bulan yang dipilih | Pagu nol atau kategori ganda **pada bulan yang sama** ditolak dekat form; simpan server gagal ditampilkan lewat toast | Pagu menyimpan periode `YYYY-MM`; badge “Terkendali”, “Mendekati batas”, “Melebihi batas” serta toast |
| Navigasi responsif | Sidebar, header, bottom nav, modal | Tidak relevan | Tidak relevan | Halaman URL tak dikenal memberi 404 | Tab aktif, URL, dan browser Back selaras |
| Konflik perubahan akun | Banner konflik menyediakan unduh draf lokal dan muat data server terbaru | Tombol simpan diblokir selama konflik | Tidak muncul tanpa konflik | Pesan `role="alert"` menerangkan bahwa draf lokal tersimpan | Draf diunduh sebelum data terbaru dimuat |

State target yang **belum lengkap**: Google OAuth dan lupa kata sandi belum punya alur UI; paginasi transaksi masih di browser. Form menampilkan status penulisan akun, mengembalikan kesalahan simpan melalui toast, dan melakukan rollback bila jaringan/server gagal. Filter tanggal dan kategori serta pagu khusus tiap bulan sudah tersedia.

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

Tipografi memakai Plus Jakarta Sans dengan fallback Inter/system, angka menggunakan `tabular-nums`, dan mata uang menggunakan `Intl.NumberFormat('id-ID')`. Kartu beradius 12 px; input/tombol 8 px. Komponen bersama di kode: `PageHeading`, `SectionHeading`, `Empty`, `BudgetBar`, ikon transaksi, badge/status, serta `EditorDialog` untuk empat jenis data. Animasi hanya pada hover dan buka modal; `prefers-reduced-motion: reduce` mematikan transisi/animasi.

## Aksesibilitas dan kontrol kualitas

- Form memakai label terlihat; elemen ikon tunggal diberi nama aksesibel. Fokus keyboard memakai ring emerald. Saat modal dibuka, fokus masuk ke field pertama; Tab/Shift+Tab tetap berada di dialog; Escape atau klik backdrop menutupnya dan fokus kembali ke pemicu. Warna status selalu didampingi teks/angka; donat memiliki `aria-label` berisi nilai setiap kategori.
- Navigasi ponsel memiliki area minimal 44 px. Tabel transaksi dapat digulir horizontal pada layar kecil; daftar kartu khusus mobile sesuai PRD belum dibuat. Pastikan fokus tidak tertutup navigasi bawah dan modal saat pemeriksaan berikutnya.
- **Perlu diperiksa sebelum P0 dinyatakan selesai:** menu mobile belum diuji menyeluruh dengan keyboard/pembaca layar; kontras teks kecil serta grafik tema gelap belum diaudit secara terukur. Audit pada 375, 768, 1024, dan 1440 px serta zoom 200% masih perlu dicatat.
