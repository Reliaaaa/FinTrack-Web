# Panduan UI/UX untuk Codex

Dokumen ini berisi hasil audit UI FinTrack dan daftar tugas untuk Codex.

## Dasar audit

- Kode: `main` pada commit `a5366b3`.
- Acuan: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) commit `a0d0410` (lisensi MIT). Audit memakai teks `SKILL.md` dan `references/quick-reference.md`.
- Skrip pencarian dan generator design system dari skill tersebut **tidak dijalankan** karena izin sesi menolaknya. Dokumen ini bukan keluaran generator.
- Pengukuran: Chromium, server `next dev`, mode demo dengan data contoh. Lebar 375, 768, 1024, dan 1440 px. Tema terang dan gelap. Halaman: dasbor, 7 halaman menu lain, dan `/login`.

## Arah desain

Pertahankan identitas yang sudah ada.

- Gunakan token warna di `src/app/globals.css` (hijau `#235347`, latar `#edf5ee`, serta pasangan tema gelap).
- Gunakan Lucide untuk ikon.
- Pertahankan `tabular-nums` untuk nominal.
- Jangan tambah library UI untuk tugas di bawah.

## Tugas

Kerjakan berurutan. Satu tugas, satu commit.

### P1

| ID | Temuan | Perbaikan | Selesai jika |
| --- | --- | --- | --- |
| UI-01 | Dasbor pada 1024 px bergeser horizontal 25 px. Elemen yang keluar layar: `.recent-row` dan nominalnya. | Beri `min-width: 0` pada kolom grid dan teks. Ubah susunan `.dashboard-bottom-grid` jika ruang masih kurang. | `scrollWidth - innerWidth` bernilai 0 pada 375, 768, 1024, 1440 px. Nominal tetap utuh. |
| UI-02 | Pada 375 px, tahun di pemilih bulan terpotong (screenshot dasbor). | Lebarkan kontrol atau ringkas isi header. | Bulan dan tahun terbaca pada 375 px. |
| UI-03 | Banyak teks di bawah 12 px. Pada dasbor 375 px: 154 dari 168 elemen teks. `globals.css` memuat 7 deklarasi 9 px, 39 deklarasi 10 px, dan 34 deklarasi 11 px. | Buat token ukuran huruf. Minimum 12 px untuk teks sekunder. | Tidak ada teks UI di bawah 12 px. UI-01 tetap lolos. |
| UI-04 | Aksi teks kecil: `Ubah` 26×15, `Hapus` 32×15, `Arsipkan` 45×15, `Masuk / Daftar` tinggi 14 px. Tautan `Laporan`, `Jadwal`, `Kelola` tinggi 22 sampai 23 px. | Perbesar area klik dengan padding atau `min-height`. | Tombol dan tautan aksi minimal 24×24 px. Pada lebar ≤700 px targetnya 44×44 px. |
| UI-05 | Sebagian field berukuran huruf di bawah 16 px pada 375 px. Safari iOS dapat memperbesar halaman saat field difokuskan. | Atur `input`, `select`, `textarea` menjadi 16 px pada lebar ≤700 px, termasuk di modal. | Semua field teks, pilihan, dan tanggal minimal 16 px di ponsel. |

### P2

| ID | Temuan | Perbaikan | Selesai jika |
| --- | --- | --- | --- |
| UI-06 | Navigasi bawah memuat 5 tujuan dan 1 tombol tambah. Tombol tambah mendorong label `Anggaran` lebih rendah dari label lain. | Pisahkan tombol tambah sebagai tombol mengambang di atas bar. | 5 label sejajar. Tombol tambah tidak menutup aksi di akhir halaman. |
| UI-07 | Pada 375 px, nama kategori di legenda donat terpotong. | Susun legenda di bawah donat dan izinkan nama membungkus baris. | Nama kategori terbaca penuh. |
| UI-08 | Tidak ada tautan lewati navigasi. | Tambahkan `Lewati ke konten` menuju `<main>`. | Tab pertama menampilkan tautan tersebut dan Enter memindahkan fokus ke konten. |
| UI-09 | Kode memakai `confirm()` bawaan browser di 4 baris `FinanceApp.tsx`. Ini bekerja, tetapi tampilannya di luar sistem desain. | Gunakan dialog konfirmasi bergaya `EditorModal`. Sebut nama item dan akibatnya. | Fokus terkunci di dialog, Escape membatalkan, fokus kembali ke pemicu. |
| UI-10 | Tabel token di `docs/03-design.md` tidak cocok dengan `globals.css`. Contoh: dokumen menulis latar `#F8FAFC`, kode memakai `#edf5ee`. | Perbarui tabel dari nilai CSS. Tambahkan halaman Investasi ke peta navigasi. | Nilai dokumen sama dengan CSS. |

## Aturan kerja

1. Buat branch `feature/<nama-tugas>` dari `dev` terbaru, sesuai `docs/reference/git-workflow.md`. Pastikan `dev` sudah memuat dokumen ini atau salin ID tugas ke prompt.
2. Jangan ubah API, skema data, validasi server, atau logika saldo.
3. Jalankan `npm run typecheck`, `npm test`, `npm run test:ui`, dan `npm run build`.
4. Sertakan screenshot 375 dan 1440 px, tema terang dan gelap, di PR.
5. Merge hanya jika CI hijau. Pemilik repo yang melakukan merge.

## Prompt untuk Codex

```text
Baca docs/10-uiux-codex.md. Kerjakan tugas P1 (UI-01 sampai UI-05) secara berurutan.
Ikuti bagian "Aturan kerja". Satu commit per tugas.
Untuk tiap tugas, laporkan file yang berubah, cara verifikasi, dan hasilnya.
Berhenti setelah membuka PR ke dev.
```

## Batas audit

- Pemeriksaan kontras otomatis tidak menemukan teks yang gagal pada latar warna solid. Teks di atas gradasi atau latar transparan dilewati. Kontras grafik belum diukur.
- Form akun tidak diaudit karena server lokal berjalan tanpa database.
- Modal, pembaca layar, urutan fokus penuh, dan zoom 200% belum diuji.
- Ukuran target diambil dari kotak elemen. Pengecualian jarak WCAG 2.5.8 dan area klik tambahan dari label pembungkus belum dinilai. Angka 24 px mengacu pada WCAG 2.2 AA. Angka 44 px adalah target sentuh yang disarankan untuk ponsel.
