# Spesifikasi UI/UX & Prompt Master Google Stitch — FinTrack Web

Dokumen ini berisi panduan sistem desain (*Design System Tokens*), arsitektur tata letak responsif, kumpulan **Prompt Master Siap Salin untuk Google Stitch** untuk seluruh halaman aplikasi **FinTrack Web**, serta arsitektur komponen React + Tailwind CSS agar hasil ekspor desain dapat langsung dihubungkan ke Backend API.

---

## 1. Identitas Visual & Design System Tokens

Gunakan acuan token ini sebagai fondasi konsistensi visual di seluruh halaman aplikasi:

* **Gaya Desain (Aesthetic):** Modern Fintech Minimalist (terinspirasi dari Linear, Stripe Dashboard, dan Wise). Bersih, kontras tinggi, *whitespace* proporsional, sudut membulat lembut (`12px` untuk kartu, `8px` untuk tombol/input), dan batas garis halus (`1px solid`) alih-alih bayangan berat.
* **Tipografi:**
  * **Primary Font:** `Plus Jakarta Sans` atau `Inter` (Clean Geometric Sans-Serif).
  * **Monospace / Angka Keuangan:** `JetBrains Mono` atau mengaktifkan fitur CSS `font-variant-numeric: tabular-nums` agar semua nominal rupiah/mata uang sejajar lurus secara vertikal di tabel dan kartu KPI.
* **Palet Warna (Light Mode Default + Dukungan Dark Mode):**
  * **Background Utama:** `#F8FAFC` (Slate 50 — lembut di mata untuk penggunaan jangka panjang) | Dark Mode: `#090D16`.
  * **Surface / Card:** `#FFFFFF` (Pure White) dengan border `#E2E8F0` (Slate 200) | Dark Mode: `#111827` dengan border `#1E293B`.
  * **Primary Brand Color:** `#0F172A` (Slate 900) dengan aksen utama `#10B981` (Emerald 500 — melambangkan pertumbuhan finansial).
  * **Semantic Colors:**
    * Pemasukan (*Income*): `#059669` (Emerald 600) dengan latar badge `#ECFDF5`.
    * Pengeluaran (*Expense*): `#E11D48` (Rose 600) dengan latar badge `#FFF1F2`.
    * Transfer / Netral: `#2563EB` (Blue 600) dengan latar badge `#EFF6FF`.
    * Peringatan Anggaran (*Warning >80%*): `#D97706` (Amber 600) dengan latar `#FFFBEB`.
  * **Teks:** Utama `#0F172A`, Sekunder `#475569`, Muted/Placeholder `#94A3B8`.

---

## 2. Struktur Navigasi & Tata Letak Global (App Shell)

* **Desktop Layout (`>= 1024px`):**
  * **Fixed Left Sidebar (`260px` lebar):** Berisi logo **FinTrack**, tombol aksi utama berwarna kontras **`+ Catat Transaksi`**, serta menu navigasi vertikal:
    1. **Dasbor** (Overview & Arus Kas)
    2. **Transaksi** (Buku Besar & Filter Mutasi)
    3. **Dompet & Akun** (Bank, E-Wallet, Tunai, Kredit)
    4. **Anggaran** (Budgeting Bulanan)
    5. **Tagihan Berulang** (Jadwal Tagihan & Gaji Otomatis)
    6. **Laporan & Analitik** (Grafik Mendalam & Ekspor CSV/PDF)
    7. **Pengaturan & Kolaborasi** (Profil, Kategori, & Dompet Keluarga)
  * **Top Header Bar (`64px` tinggi):** Pemilih rentang periode global (contoh: *November 2026*), bilah pencarian cepat (`Cmd/Ctrl + K`), tombol pengalih tema (*Light/Dark*), ikon notifikasi peringatan anggaran, dan avatar profil pengguna.
  * **Main Content Area:** Maksimal lebar `1440px` terpusat dengan padding `24px–32px` dan sistem grid 12 kolom (*gap 20px*).
* **Mobile Web / PWA Layout (`< 768px`):**
  * Sidebar disembunyikan, digantikan oleh **Bottom Navigation Bar** tetap di bawah layar dengan 4 tab utama (Dasbor, Transaksi, Anggaran, Dompet) dan 1 tombol **Floating Action Button (`+`)** menonjol di tengah untuk input transaksi cepat.

---

## 3. Kumpulan Prompt Master untuk Google Stitch (Lengkap Semua Halaman)

Gunakan prompt di bawah ini secara berurutan di **Google Stitch**. Mulai dari **Prompt 1** untuk membangun fondasi tema dan *App Shell*, lalu gunakan **Prompt 2 hingga Prompt 7** sebagai *follow-up screens* di proyek Stitch yang sama.

### Prompt 1: Halaman Utama — Dasbor Keuangan (Main Dashboard)

> **Salin ke Stitch:**
> "Design a modern, clean, high-precision personal finance web application dashboard named 'FinTrack' in Indonesian language. Use a light mode SaaS fintech aesthetic inspired by Stripe and Linear with a `#F8FAFC` off-white background, pure white `#FFFFFF` cards, crisp `1px solid #E2E8F0` borders, and `12px` rounded corners. Typography uses Inter with strict `tabular-nums` alignment for all currency values formatted in Indonesian Rupiah (Rp).
>
> **Layout Structure:**
> 1. **Left Sidebar (260px fixed):** Brand logo 'FinTrack' with an emerald green geometric icon at the top. Below it, a prominent dark slate `#0F172A` full-width primary CTA button '+ Catat Transaksi'. Navigation menu items: 'Dasbor' (active state with soft emerald highlight), 'Transaksi', 'Dompet & Akun', 'Anggaran', 'Tagihan Berulang', 'Laporan', and 'Pengaturan'. Bottom section shows a compact user profile card.
> 2. **Top Header (64px):** Page title 'Ringkasan Keuangan', a date range selector pill 'November 2026', a quick search bar 'Cari transaksi...', a notification bell icon with a red dot, and a dark/light mode toggle.
> 3. **Main Content Grid:**
>    - **Row 1 (4 KPI Summary Cards):**
>      - Card 1: 'Total Kekayaan Bersih' -> `Rp 48.750.000` with a green pill badge `+8,4% bulan ini`.
>      - Card 2: 'Pemasukan Bulan Ini' -> `Rp 14.500.000` with emerald upward icon.
>      - Card 3: 'Pengeluaran Bulan Ini' -> `Rp 6.820.000` with rose red downward icon.
>      - Card 4: 'Sisa Anggaran Aman' -> `Rp 3.180.000` with a subtle progress indicator.
>    - **Row 2 (8-col + 4-col Split):**
>      - Left (8 cols): 'Tren Arus Kas (6 Bulan Terakhir)' featuring a smooth dual-bar and line chart comparing Pemasukan (Emerald `#10B981`) vs Pengeluaran (Rose `#F43F5E`), with clean gridlines and interactive tooltip styling.
>      - Right (4 cols): 'Distribusi Pengeluaran' featuring a modern donut chart with center total `Rp 6,82 Jt` and a clean legend below (Makanan & Minuman 35%, Transportasi 20%, Tagihan & Utilitas 25%, Hiburan 20%).
>    - **Row 3 (6-col + 6-col Split):**
>      - Left (6 cols): 'Status Anggaran Kategori' showing horizontal progress bars for 'Makan & Kopi' (`Rp 1.400.000 / Rp 1.500.000` - Amber warning bar 93%), 'Transportasi' (`Rp 650.000 / Rp 1.000.000` - Emerald bar 65%), and 'Belanja Bulanan' (`Rp 1.100.000 / Rp 2.000.000` - Emerald bar 55%).
>      - Right (6 cols): 'Transaksi Terbaru' clean list showing merchant/title, category icon pill, wallet badge (e.g., 'BCA', 'GoPay', 'Tunai'), date, and right-aligned tabular currency amounts (`-Rp 45.000` in rose red, `+Rp 14.500.000` in emerald green)."

---

### Prompt 2: Halaman Daftar Transaksi & Modal Input Cepat

> **Salin ke Stitch:**
> "Keep the exact same sidebar, header, font, and color palette from the previous screen. Design the 'Transaksi' (Transactions Ledger) web page for 'FinTrack' in Indonesian.
>
> **Main Page Content:**
> - **Filter & Action Toolbar:** Search input 'Cari catatan atau nominal...', dropdown filters for 'Semua Dompet' (BCA, Mandiri, GoPay, Tunai), 'Semua Kategori', 'Tipe' (Pemasukan, Pengeluaran, Transfer), date range picker, and a secondary outline button 'Ekspor CSV'.
> - **Data Table Card:** Clean, spacious fintech ledger table with columns: Checkbox, Tanggal & Waktu, Deskripsi & Catatan, Kategori (colored pill badges with icons), Dompet (subtle gray border badge), Lampiran Struk (paperclip icon), and Nominal (right-aligned monospace numbers, green `+` for income, red `-` for expense, blue for transfer). Include 8 realistic Indonesian transaction rows (e.g., 'Kopi Kenangan', 'Gaji Bulanan', 'Transfer ke GoPay', 'Listrik PLN Token', 'GrabCar').
> - **Overlay Modal (Center-screen elevated dialog with backdrop blur):** Title 'Catat Transaksi Baru'. Top segmented control tabs with 3 options: 'Pengeluaran' (active rose pill), 'Pemasukan', and 'Transfer'. Large prominent numeric amount input field displaying `Rp 125.000`. Two-column form fields below: 'Pilih Dompet' dropdown, 'Kategori' dropdown with icon, 'Tanggal' picker, 'Catatan' text input, and a dashed drag-and-drop zone 'Unggah Foto Struk (Opsional)'. Bottom right buttons: 'Batal' (ghost) and 'Simpan Transaksi' (solid `#0F172A` button)."

---

### Prompt 3: Halaman Dompet & Perencanaan Anggaran (Wallets & Budgeting)

> **Salin ke Stitch:**
> "Keep the exact same sidebar, header, font, and color palette from the previous screen. Design the 'Dompet & Anggaran' (Wallets and Monthly Budgeting) web view for 'FinTrack' in Indonesian.
>
> **Top Section — Daftar Dompet Saya (Horizontal Grid of 4 Cards):**
> - Card 1 (Bank): Dark gradient card (`#0F172A` to `#1E293B`) with white text, bank icon, 'Bank BCA Utama', account number masked `•••• 4821`, balance `Rp 32.450.000`, and a subtle 'Shared (2 Anggota)' pill badge.
> - Card 2 (E-Wallet): Crisp white card with blue accent bar, 'GoPay & QRIS', balance `Rp 1.850.000`.
> - Card 3 (Savings/Investment): Crisp white card with emerald accent bar, 'Bibit / Reksadana', balance `Rp 13.200.000`.
> - Card 4 (Add New): Dashed border card `+ Tambah Dompet Baru`.
>
> **Bottom Section — Perencanaan Anggaran November 2026:**
> - Header with total budget summary: 'Total Dianggarkan: Rp 10.000.000 | Terpakai: Rp 6.820.000 (68%)' and button '+ Atur Anggaran'.
> - 3-column grid of Category Budget Cards. Each card displays category icon, category name (e.g., 'Makanan & Minuman', 'Transportasi', 'Tagihan & Internet', 'Hiburan & Hobi', 'Kesehatan', 'Belanja Kebutuhan'), spent vs limit text (`Rp 1.400.000 / Rp 1.500.000`), percentage badge, thick rounded progress bar (emerald `<75%`, amber `75%-95%`, rose `>100%`), and remaining daily safe-to-spend hint at the bottom (e.g., 'Sisa aman: Rp 10.000/hari')."

---

### Prompt 4: Halaman Transaksi Berulang (Recurring Bills & Income)

> **Salin ke Stitch:**
> "Keep the exact same sidebar, header, font, and color palette from the previous screen. Design the 'Tagihan & Transaksi Berulang' (Recurring Transactions) web page for 'FinTrack' in Indonesian.
>
> **Main Content:**
> - **Top Summary Banner (3 Metric Cards):** 'Total Tagihan Rutin Bulan Ini' (`Rp 2.450.000`), 'Pemasukan Terjadwal' (`Rp 14.500.000`), and 'Jadwal Berikutnya' (`Listrik & Internet - 20 Nov 2026`).
> - **Action Bar:** Title 'Daftar Jadwal Otomatis' with filter tabs ('Semua', 'Pengeluaran Rutin', 'Pemasukan Rutin') and primary button '+ Buat Jadwal Baru'.
> - **Recurring Schedule Cards / Table:** Clean list of automated schedules showing: Icon & Title (e.g., 'Gaji Bulanan PT Teknologi', 'Langganan Internet Fiber', 'Cicilan KPR / Kos', 'Spotify & Cloud Storage'), Frequency badge ('Setiap Tanggal 25', 'Bulanan'), Source Wallet ('Bank BCA'), Next Execution Date, Nominal amount (`+Rp 14.500.000` or `-Rp 450.000`), and an interactive iOS-style toggle switch (Active Emerald / Paused Gray) with Edit/Delete action icons."

---

### Prompt 5: Halaman Laporan & Analitik Mendalam (Analytics & Export)

> **Salin ke Stitch:**
> "Keep the exact same sidebar, header, font, and color palette from the previous screen. Design the 'Laporan & Analitik Keuangan' (Financial Reports & Analytics) web page for 'FinTrack' in Indonesian.
>
> **Main Content:**
> - **Top Control Bar:** Period selector ('Tahun 2026', '6 Bulan Terakhir', 'Custom Range'), Wallet filter ('Semua Dompet'), and prominent export buttons group: 'Unduh PDF', 'Ekspor Excel (.XLSX)', and 'CSV'.
> - **Row 1 (Full-Width Chart Card):** 'Pertumbuhan Kekayaan Bersih & Tabungan (Net Worth Trend)' featuring a smooth emerald area chart with gradient fill showing steady growth from Jan to Nov 2026, accompanied by key metrics: 'Rata-rata Pemasukan Bulanan', 'Rata-rata Pengeluaran Bulanan', and 'Rasio Tabungan (Savings Rate): 46,8%'.
> - **Row 2 (2-Column Split):**
>   - Left: 'Perbandingan Pengeluaran per Kategori (Bulan Ini vs Bulan Lalu)' horizontal grouped bar chart.
>   - Right: 'Top 5 Merchant / Pengeluaran Terbesar' clean ranked list with transaction count and total amount."

---

### Prompt 6: Halaman Pengaturan, Kategori & Kolaborasi Dompet Keluarga

> **Salin ke Stitch:**
> "Keep the exact same sidebar, header, font, and color palette from the previous screen. Design the 'Pengaturan & Kolaborasi' (Settings, Custom Categories & Family Shared Wallets) web page for 'FinTrack' in Indonesian.
>
> **Layout:**
> - **Horizontal Sub-Navigation Tabs:** 'Profil & Keamanan', 'Kategori Kustom', 'Kolaborasi Keluarga (Shared Wallets)', and 'Impor Data CSV'.
> - **Active Tab Content ('Kolaborasi Keluarga & Kategori'):**
>   - **Top Card — Akses Dompet Bersama:** Shows 'Dompet Rumah Tangga (BCA)' with an invite input field 'Masukkan email anggota keluarga...', role dropdown ('Editor - Bisa Catat' / 'Viewer - Hanya Lihat'), and 'Kirim Undangan' button. Below it, a clean member list showing avatar, name, email, role badge, and 'Hapus Akses' button.
>   - **Bottom Card — Manajemen Kategori Kustom:** Two-column grid ('Kategori Pengeluaran' & 'Kategori Pemasukan') displaying colorful icon badges (e.g., Makanan, Transportasi, Belanja, Gaji, Bonus) with a '+ Tambah Kategori' button."

---

### Prompt 7: Halaman Autentikasi (Login & Register Web)

> **Salin ke Stitch:**
> "Design a sleek, high-trust split-screen authentication login and registration web page for 'FinTrack' personal finance tracker in Indonesian.
>
> **Left Side (50% - Form Area on `#FFFFFF` background):**
> - Top-left 'FinTrack' logo with emerald green geometric icon.
> - Heading 'Selamat Datang Kembali' and subtitle 'Kelola arus kas, anggaran, dan tabungan Anda dalam satu dasbor terpadu.'
> - Clean Google Sign-In button with Google 'G' logo: 'Masuk dengan Google'.
> - Subtle divider 'atau masuk dengan email'.
> - Form inputs with crisp `1px solid #E2E8F0` borders and `8px` radius: 'Alamat Email' (`nama@email.com`), 'Kata Sandi' with eye visibility toggle and 'Lupa kata sandi?' link.
> - Full-width solid `#0F172A` primary submit button 'Masuk ke Dasbor'.
> - Bottom link: 'Belum punya akun? Daftar gratis sekarang'.
>
> **Right Side (50% - Visual Showcase on `#0F172A` Deep Slate background):**
> - Subtle grid pattern background with glowing emerald `#10B981` accent blur.
> - Floating glassmorphic preview card displaying a clean mini dashboard widget: 'Total Saldo Gabungan Rp 48.750.000', a mini emerald cashflow sparkline chart, and a 'Anggaran Aman 92%' badge.
> - Bottom testimonial quote: 'FinTrack membantu keluarga kami menghemat 25% pengeluaran bulanan sejak bulan pertama.' — Budi Santoso, Product Designer."

---

## 4. Arsitektur Komponen Frontend (React + Tailwind CSS)

Setelah mengekspor kode HTML/React dari Google Stitch, organisasikan komponen frontend Next.js Anda menggunakan struktur berikut agar mudah terhubung dengan API backend pada `prd_tracker_keuangan.md`:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx               # Prompt 7
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # App Shell (Sidebar Desktop + Bottom Nav Mobile)
│   │   ├── page.tsx                     # Prompt 1: Dasbor Utama
│   │   ├── transactions/page.tsx        # Prompt 2: Buku Besar Transaksi
│   │   ├── wallets/page.tsx             # Prompt 3: Dompet & Anggaran
│   │   ├── recurring/page.tsx           # Prompt 4: Transaksi Berulang
│   │   ├── reports/page.tsx             # Prompt 5: Laporan & Analitik
│   │   └── settings/page.tsx            # Prompt 6: Pengaturan & Kolaborasi
├── components/
│   ├── ui/                              # Komponen dasar (Button, Card, Input, Dialog, Badge)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopHeader.tsx
│   │   └── MobileBottomNav.tsx
│   ├── dashboard/
│   │   ├── KpiSummaryGrid.tsx
│   │   ├── CashflowChart.tsx            # Recharts Bar/Line Chart
│   │   ├── ExpenseDonutChart.tsx
│   │   └── BudgetProgressWidget.tsx
│   └── transactions/
│       ├── TransactionTable.tsx
│       ├── QuickAddTransactionModal.tsx # Modal Input Cepat (+ Catat Transaksi)
│       └── ReceiptDropzone.tsx          # Upload struk ke S3/R2
├── hooks/
│   ├── useTransactions.ts               # TanStack Query hooks ke /api/v1/transactions
│   ├── useWallets.ts                    # TanStack Query hooks ke /api/v1/wallets
│   └── useBudgets.ts                    # TanStack Query hooks ke /api/v1/budgets
└── lib/
    ├── api-client.ts                    # Axios/Fetch instance dengan HTTP-Only Cookie
    └── formatters.ts                    # Helper formatRupiah() dengan tabular-nums
```

### Utilitas Pemformatan Mata Uang (Wajib untuk Konsistensi UI)

Gunakan fungsi pemformatan berikut pada setiap angka keuangan di komponen React agar sejajar rapi:

```typescript
// src/lib/formatters.ts
export function formatRupiah(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (!showSign) return amount < 0 ? `-${formatted}` : formatted;
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}
```