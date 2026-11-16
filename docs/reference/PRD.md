# Product Requirements Document (PRD): FinTrack Web (Aplikasi Pencatat Keuangan Berbasis Website Full-Stack)

## 1. Ringkasan Eksekutif, Pernyataan Masalah, dan Solusi

**Ringkasan Eksekutif**
FinTrack Web adalah aplikasi pencatat keuangan pribadi dan keluarga berbasis web (*Full-Stack Web Application*) yang dapat diakses langsung melalui peramban (*browser*) di perangkat desktop maupun mobile tanpa perlu instalasi rumit. Aplikasi ini menggabungkan pencatatan transaksi harian, manajemen anggaran berbasis kategori, pelacakan multi-dompet (rekening bank, e-wallet, uang tunai, dan kartu kredit), serta dasbor analitik arus kas interaktif dalam satu platform terpadu.

**Pernyataan Masalah**
* Pengguna sering kali enggan menginstal aplikasi tambahan di setiap perangkat hanya untuk mencatat pengeluaran harian atau mengecek laporan keuangan.
* Pencatatan menggunakan *spreadsheet* manual (seperti Excel atau Google Sheets) rentan terhadap kesalahan rumus, sulit diakses dengan nyaman melalui layar ponsel, dan tidak memiliki pengingat batas anggaran otomatis.
* Pengguna membutuhkan tampilan dasbor yang luas di layar komputer untuk menganalisis laporan keuangan secara mendalam, namun tetap memerlukan akses cepat dan responsif saat membuka situs melalui *browser* ponsel.

**Solusi yang Ditawarkan**
* Membangun aplikasi web modern berbasis **Single Page Application (SPA) / Server-Side Rendering (SSR)** yang responsif di seluruh ukuran layar (Desktop, Tablet, dan Mobile).
* Mendukung teknologi **Progressive Web App (PWA)** sehingga pengguna dapat memasang pintasan aplikasi di layar utama (*Home Screen*), menerima notifikasi web (*Web Push*), dan tetap dapat mengakses data terakhir secara cepat.
* Menyediakan arsitektur backend terpusat yang aman untuk menyimpan data secara *real-time*, mengelola autentikasi pengguna, memproses jadwal transaksi berulang, dan menghasilkan laporan keuangan siap unduh.

---

## 2. Arsitektur Sistem dan Rekomendasi Teknologi (Full-Stack Web)

**Rekomendasi Tech Stack**
* **Frontend Web:** **Next.js (React + TypeScript)** dengan **Tailwind CSS** dan komponen UI dari **Shadcn/UI** (atau Radix UI). Menggunakan **TanStack Query (React Query)** untuk manajemen *state* server dan *caching* data agar navigasi antar halaman terasa instan, serta **Recharts** atau **Chart.js** untuk visualisasi grafik keuangan.
* **Backend API:** **Node.js (TypeScript)** menggunakan framework **NestJS** atau **Express/Fastify** (alternatif: **Go dengan Fiber/Gin** untuk performa tinggi). Backend bertugas menangani logika bisnis, validasi data, keamanan, dan integrasi pihak ketiga.
* **Basis Data Utama & ORM:** **PostgreSQL** sebagai basis data relasional utama untuk menjamin integritas transaksi keuangan (*ACID compliance*), diakses menggunakan **Prisma ORM** atau **Drizzle ORM**.
* **Caching & Antrean Tugas (Background Jobs):** **Redis** dan **BullMQ** untuk menangani *caching* laporan dasbor, pembatasan laju permintaan (*rate limiting*), serta eksekusi otomatis transaksi berulang harian/bulanan.
* **Penyimpanan File (Object Storage):** **AWS S3**, **Cloudflare R2**, atau **MinIO** untuk menyimpan gambar foto struk belanja dan file hasil ekspor laporan.
* **Infrastruktur & Deployment:** Kontainerisasi menggunakan **Docker**, dengan deployment frontend di **Vercel** atau **Cloudflare Pages**, serta backend dan database di **VPS (Ubuntu + Nginx)** atau layanan cloud terkelola (Railway/Render/AWS).

---

## 3. Kategorisasi Fitur Fungsional Berdasarkan Peran Pengguna

**Pengguna Standar (Individu)**
* Melakukan registrasi, login (Email/Password serta OAuth Google), pemulihan kata sandi, dan pengaturan profil.
* Membuat, mengubah, dan mengelola berbagai dompet/akun keuangan (Tunai, Rekening Bank, E-Wallet, Kartu Kredit) lengkap dengan saldo awal dan mata uang.
* Mencatat transaksi Pemasukan, Pengeluaran, dan Transfer antar-dompet disertai kategori, tanggal, catatan, dan unggah foto struk belanja.
* Menetapkan batas anggaran (*budgeting*) bulanan per kategori dan memantau persentase pemakaian secara *real-time*.
* Mengatur jadwal transaksi berulang otomatis (gaji bulanan, tagihan listrik, biaya langganan).
* Melihat dasbor analitik interaktif (grafik arus kas bulanan, diagram lingkaran pengeluaran per kategori, tren kekayaan bersih) serta mengunduh laporan ke format PDF, CSV, dan Excel (XLSX).

**Pengguna Keluarga / Kolaborator (Shared Wallet)**
* Mengundang anggota keluarga atau pasangan melalui tautan/email untuk bergabung ke dalam satu dompet bersama.
* Mengatur tingkat hak akses kolaborator sebagai **Viewer** (hanya melihat transaksi) atau **Editor** (dapat menambah dan mengubah transaksi).
* Melihat log riwayat aktivitas (*audit trail*) untuk mengetahui siapa yang menambahkan atau mengubah transaksi tertentu.

**Administrator Sistem (Admin Panel Web)**
* Mengakses halaman dasbor admin khusus untuk memantau statistik pengguna aktif, total transaksi sistem, dan status kesehatan server/antrean tugas.
* Mengelola daftar kategori bawaan sistem, daftar mata uang global, dan pembaruan nilai tukar kurs harian.
* Mengelola status akun pengguna (aktivasi/suspensi jika terdeteksi penyalahgunaan).

---

## 4. Prioritas Fitur (Metode MoSCoW)

| Kategori | Kode | Fitur | Deskripsi Singkat |
| :--- | :--- | :--- | :--- |
| **Must Have** | M-01 | Autentikasi & Manajemen Sesi Web | Registrasi, login email/Google OAuth, proteksi rute dengan JWT/HTTP-Only Cookies, dan reset password. |
| **Must Have** | M-02 | Manajemen Multi-Dompet | Tambah, ubah, arsipkan, dan pantau saldo dari berbagai sumber dana secara terpisah maupun total gabungan. |
| **Must Have** | M-03 | Pencatatan Transaksi CRUD | Tambah, edit, hapus, filter, dan cari transaksi (Pemasukan, Pengeluaran, Transfer) dengan pembaruan saldo otomatis. |
| **Must Have** | M-04 | Anggaran Bulanan (Budgeting) | Penetapan batas pengeluaran per kategori dengan bilah progres visual dan indikator peringatan jika mendekati/melewati batas. |
| **Must Have** | M-05 | Dasbor Analitik & Grafik | Ringkasan pemasukan vs pengeluaran bulan berjalan, distribusi kategori, dan daftar transaksi terbaru. |
| **Should Have** | S-01 | Transaksi Berulang Otomatis | Penjadwalan otomatis via *cron job* backend untuk pemasukan atau tagihan rutin. |
| **Should Have** | S-02 | Ekspor & Impor Data (CSV/XLSX/PDF) | Mengunduh laporan mutasi bulanan dan mengimpor catatan transaksi massal dari file CSV/Excel. |
| **Should Have** | S-03 | Unggah & Pratinjau Struk | Fitur *drag-and-drop* foto struk transaksi ke penyimpanan cloud dengan pratinjau gambar langsung di web. |
| **Should Have** | S-04 | Dukungan PWA & Tema Gelap (Dark Mode) | Dukungan instalasi ke layar utama perangkat serta pergantian tema terang/gelap (*Light/Dark Mode*). |
| **Could Have** | C-01 | Dompet Kolaborasi Keluarga | Berbagi akses pencatatan satu dompet tertentu dengan anggota keluarga lain beserta riwayat perubahan. |
| **Could Have** | C-02 | Dukungan Multi-Mata Uang | Pencatatan transaksi dalam berbagai mata uang dengan konversi kurs otomatis menggunakan API kurs eksternal. |
| **Could Have** | C-03 | Pemindai Struk Otomatis (OCR) | Ekstraksi teks nominal dan tanggal otomatis saat pengguna mengunggah foto struk di web. |
| **Won't Have** | W-01 | Integrasi Mutasi Bank Otomatis (Open Banking) | Penarikan mutasi rekening bank langsung via API perbankan pada rilis versi pertama. |
| **Won't Have** | W-02 | Pelacakan Aset Kripto & Saham Live | Integrasi harga pasar modal atau aset kripto secara *real-time* pada versi awal. |

---

## 5. Spesifikasi Non-Fungsional

**Keamanan Web & Backend**
* Seluruh lalu lintas web wajib menggunakan protokol **HTTPS (TLS 1.3)** dengan penerapan header keamanan standar web (*Helmet.js*, *Content Security Policy*, perlindungan *XSS* dan *CSRF*).
* Kata sandi pengguna wajib di-hash menggunakan algoritma **Argon2id** atau **bcrypt** (minimal 12 *salt rounds*).
* Token autentikasi disimpan menggunakan **HTTP-Only, Secure, SameSite Cookie** untuk mencegah pencurian token melalui skrip berbahaya di browser.
* Penerapan *Rate Limiting* pada endpoint sensitif (login, registrasi, reset password) untuk mencegah serangan *brute-force*.

**Kinerja & Optimasi Web**
* Skor performa web (Core Web Vitals / Lighthouse) minimal 90 untuk akses desktop dan mobile.
* Waktu muat halaman pertama (*First Contentful Paint*) maksimal 1,5 detik.
* Waktu respons API backend untuk operasi baca/tulis standar maksimal 150 milidetik, dengan dukungan *pagination* berbasis kursor/halaman untuk tabel transaksi berisi ribuan data.

**Skalabilitas & Keandalan**
* Backend dirancang *stateless* agar mudah diskalakan secara horizontal menggunakan Docker dan *Load Balancer*.
* Pencadangan (*backup*) otomatis basis data PostgreSQL dilakukan setiap hari ke penyimpanan cloud terpisah.

---

## 6. Struktur Basis Data dan Desain API

**Struktur Basis Data Utama (PostgreSQL)**
* **`users`**: `id` (UUID, PK), `name` (VARCHAR), `email` (VARCHAR, Unique), `password_hash` (VARCHAR, Nullable untuk OAuth), `avatar_url` (VARCHAR, Nullable), `default_currency` (VARCHAR, default 'IDR'), `role` (ENUM: user, admin), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
* **`wallets`**: `id` (UUID, PK), `user_id` (UUID, FK), `name` (VARCHAR), `type` (ENUM: cash, bank, ewallet, credit), `balance` (DECIMAL 15,2), `currency` (VARCHAR), `color_hex` (VARCHAR), `is_archived` (BOOLEAN), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
* **`wallet_members`** *(Untuk Fitur Kolaborasi)*: `id` (UUID, PK), `wallet_id` (UUID, FK), `user_id` (UUID, FK), `permission` (ENUM: viewer, editor), `invited_at` (TIMESTAMP).
* **`categories`**: `id` (UUID, PK), `user_id` (UUID, FK, Nullable untuk kategori default), `name` (VARCHAR), `type` (ENUM: income, expense), `icon_name` (VARCHAR), `color_hex` (VARCHAR).
* **`transactions`**: `id` (UUID, PK), `wallet_id` (UUID, FK), `target_wallet_id` (UUID, FK, Nullable untuk transfer), `category_id` (UUID, FK), `created_by_user_id` (UUID, FK), `type` (ENUM: income, expense, transfer), `amount` (DECIMAL 15,2), `note` (TEXT), `receipt_url` (VARCHAR, Nullable), `transaction_date` (TIMESTAMP), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
* **`budgets`**: `id` (UUID, PK), `user_id` (UUID, FK), `category_id` (UUID, FK), `amount_limit` (DECIMAL 15,2), `period_month` (INT), `period_year` (INT), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
* **`recurring_transactions`**: `id` (UUID, PK), `user_id` (UUID, FK), `wallet_id` (UUID, FK), `category_id` (UUID, FK), `type` (ENUM: income, expense), `amount` (DECIMAL 15,2), `frequency` (ENUM: daily, weekly, monthly, yearly), `next_run_date` (DATE), `is_active` (BOOLEAN).

**Daftar Endpoint API Utama (RESTful JSON)**
* **Autentikasi:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/google`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
* **Dompet (Wallets):** `GET /api/v1/wallets`, `POST /api/v1/wallets`, `PATCH /api/v1/wallets/:id`, `DELETE /api/v1/wallets/:id`
* **Transaksi:** `GET /api/v1/transactions` (mendukung parameter query `page`, `limit`, `walletId`, `categoryId`, `type`, `startDate`, `endDate`, `search`), `POST /api/v1/transactions`, `PATCH /api/v1/transactions/:id`, `DELETE /api/v1/transactions/:id`
* **Unggah Struk:** `POST /api/v1/uploads/receipt` (mengembalikan URL gambar aman dari Object Storage)
* **Anggaran (Budgets):** `GET /api/v1/budgets?month=11&year=2026`, `POST /api/v1/budgets`, `PATCH /api/v1/budgets/:id`, `DELETE /api/v1/budgets/:id`
* **Laporan & Analitik:** `GET /api/v1/analytics/summary`, `GET /api/v1/analytics/cashflow`, `GET /api/v1/reports/export?format=xlsx|csv|pdf`

---

## 7. Panduan Antarmuka Pengguna Web (UI/UX Responsif)

**Tampilan Desktop (Layar Lebar $\ge 1024\text{px}$)**
* Menggunakan tata letak *Sidebar* tetap di sisi kiri untuk navigasi utama (Dasbor, Transaksi, Dompet, Anggaran, Transaksi Berulang, Laporan, Pengaturan) dan *Top Header* untuk pencarian cepat, tombol pintasan "+ Catat Transaksi", pergantian tema gelap/terang, dan menu profil.
* Halaman **Dasbor** menampilkan 4 kartu ringkasan di bagian atas (Total Saldo, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Rasio Tabungan), grafik batang arus kas 6 bulan terakhir di sisi kiri, diagram donat pengeluaran per kategori di sisi kanan, serta tabel 10 transaksi terakhir di bagian bawah.
* Halaman **Transaksi** menggunakan tabel interaktif lengkap dengan filter tanggal, filter dompet/kategori, dan laci samping (*Slide-over Drawer*) untuk menambah atau mengedit transaksi tanpa berpindah halaman.

**Tampilan Mobile Web (Layar Kecil $< 768\text{px}$)**
* *Sidebar* otomatis berubah menjadi bilah navigasi bawah (*Bottom Navigation Bar*) yang ringkas dengan tombol aksi cepat (+) di bagian tengah.
* Tabel transaksi beradaptasi menjadi daftar kartu vertikal (*Card List*) yang mudah digulir dengan ibu jari, lengkap dengan modal penuh (*Full-Screen Modal*) untuk pengisian nominal transaksi yang nyaman di layar sentuh.

---

## 8. Jadwal Pengembangan Website (Roadmap)

**Fase 1: Perancangan Basis Data & Backend Core API (Minggu 1 – 3)**
* Inisialisasi proyek backend (NestJS/Express + TypeScript), konfigurasi PostgreSQL, dan migrasi skema menggunakan Prisma ORM.
* Pengembangan modul autentikasi (Email/Password, Google OAuth, HTTP-Only Cookies) dan manajemen dompet serta kategori.
* Pengembangan logika transaksi CRUD beserta mekanisme *database transaction* untuk menjaga akurasi perubahan saldo dompet.

**Fase 2: Pengembangan Frontend Web Inti & Dasbor (Minggu 4 – 7)**
* Inisialisasi proyek Next.js + Tailwind CSS + Shadcn/UI.
* Pembangunan halaman autentikasi, tata letak responsif (Desktop Sidebar & Mobile Bottom Bar), dan halaman manajemen dompet.
* Implementasi halaman pencatatan transaksi dengan filter pencarian, paginasi, dan integrasi grafik pada halaman dasbor utama.

**Fase 3: Modul Anggaran, Laporan, & Penyimpanan Cloud (Minggu 8 – 10)**
* Pengembangan fitur penetapan anggaran bulanan (*budgeting*) beserta kalkulasi progres otomatis.
* Integrasi penyimpanan objek (S3/Cloudflare R2) untuk fitur unggah foto struk transaksi.
* Pembuatan fitur ekspor laporan keuangan ke format CSV, Excel (XLSX), dan PDF, serta fitur impor mutasi dari file CSV.

**Fase 4: Otomatisasi Backend, PWA, & Fitur Kolaborasi (Minggu 11 – 12)**
* Implementasi *background worker* (Redis + BullMQ) untuk mengeksekusi jadwal transaksi berulang otomatis.
* Konfigurasi *Service Worker* dan *Web App Manifest* agar aplikasi dapat diinstal sebagai PWA dan mendukung mode gelap (*Dark Mode*).
* Pengujian menyeluruh (*End-to-End Testing* dengan Playwright), audit keamanan API, dan deployment ke server produksi.