# Master Prompt & Konfigurasi OpenAI Codex — `fullstack-app-team` (FinTrack Web)

Dokumen ini berisi pemetaan model **ChatGPT (`gpt-5.6` hingga `gpt-6.1` dengan varian tier Luna, Sol, Terra, dan Astra)** untuk setiap peran agent serta **Master Prompt Siap Salin** yang dapat langsung dijalankan pada sesi OpenAI Codex (CLI / IDE / Web) untuk membangun aplikasi **FinTrack Web** secara *end-to-end*.

## 1. Pemetaan Model ChatGPT (`Luna`, `Sol`, `Terra`, `Astra`) per Agent

Setiap sub-agent dikonfigurasi menggunakan kombinasi versi (`5.6`–`6.1`) dan varian tier model (**Luna**, **Sol**, **Terra**, **Astra**) yang berbeda sesuai tingkat kompleksitas penalaran, desain, implementasi kode, dan auditnya:

| No | Peran Agent | Model / Varian ChatGPT | Karakteristik & Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **1** | **Project Manager (PM)** | `gpt-5.6-luna` / `Luna` | Cepat, ringan, dan terstruktur untuk memecah PRD menjadi backlog fitur P0–P2. |
| **2** | **Architect** | `gpt-6.1-astra` / `Astra` | Kapasitas penalaran arsitektur tertinggi untuk merancang sistem & alur data kompleks. |
| **3** | **Designer (UI/UX)** | `gpt-5.8-sol` / `Sol` | Seimbang dan presisi dalam pemahaman visual, hierarki komponen Tailwind/shadcn, dan state UI. |
| **4** | **Backend System** | `gpt-6-terra` / `Terra` | Kuat dan stabil untuk penulisan kode API kompleks, autentikasi JWT, dan test runner. |
| **5** | **Database Engineer** | `gpt-5.8-terra` / `Terra` | Presisi tinggi untuk skema relasional PostgreSQL/Prisma, indexing, migrasi, dan enkripsi. |
| **6** | **QA Engineer** | `gpt-5.6-luna` / `Luna` | Cepat, responsif, dan sistematis dalam menyusun unit test, integration test, dan edge cases. |
| **7** | **Security Dev** | `gpt-6.1-astra` / `Astra` | Analisis keamanan mendalam untuk audit celah OWASP Top 10, SQL injection, dan proteksi sesi. |
| **8** | **DevOps Engineer** | `gpt-6-sol` / `Sol` | Efisien dan akurat untuk membuat file konfigurasi YAML GitHub Actions, Docker, dan CI/CD. |
| **9** | **Tech Lead (Reviewer)** | `gpt-6.1-astra` / `Astra` | Evaluasi kritis tingkat tertinggi untuk gatekeeping akhir (status `LOLOS` / `KEMBALI`). |

*(Catatan: Jika antarmuka Codex Anda menampilkan nama varian langsung seperti `Luna`, `Sol`, `Terra`, dan `Astra` tanpa prefiks angka versi, gunakan langsung nama varian tersebut).*

---

## 2. Master Prompt Siap Salin untuk Codex

Pastikan file `prd_tracker_keuangan.md` dan `uiux_stitch_fintrack.md` sudah berada di root repository Anda sebelum menjalankan prompt berikut di Codex:

```text
Kamu adalah Orchestrator & Engineering Manager untuk proyek aplikasi web fullstack "FinTrack Web".
Gunakan dokumen referensi di root repository: `prd_tracker_keuangan.md` dan `uiux_stitch_fintrack.md` (serta komponen hasil ekspor Google Stitch jika sudah ada di folder `frontend/`).

Tugasmu adalah menjalankan alur kerja `fullstack-app-team` dengan 9 agent pembantu secara berurutan (dan paralel hanya untuk agent yang independen). Kamu WAJIB menugaskan model ChatGPT dengan varian yang berbeda (`Luna`, `Sol`, `Terra`, `Astra` pada seri `gpt-5.6`–`gpt-6.1`) untuk tiap sub-agent sesuai spesifikasi peran berikut saat memanggil Agent/Sub-task tool:

### Konfigurasi Model ChatGPT (`Luna` / `Sol` / `Terra` / `Astra`) & Tugas per Agent:
1. **Project Manager (`model: gpt-5.6-luna` / varian `Luna`)**
   - Input: `prd_tracker_keuangan.md`.
   - Output: `docs/01-features.md` (pecah menjadi fitur terkecil dengan ID, deskripsi 1 kalimat, prioritas P0/P1/P2, ketergantungan, kriteria selesai 1-3 hari, urutan rilis MVP).
2. **Architect (`model: gpt-6.1-astra` / varian `Astra`)**
   - Input: `docs/01-features.md` & `prd_tracker_keuangan.md`.
   - Output: `docs/02-architecture.md` (struktur folder monorepo `frontend/` Next.js + `backend/` NestJS/Node.js, pola Clean Architecture, diagram alur data, daftar library + versi, aturan penamaan).
3. **Designer (`model: gpt-5.8-sol` / varian `Sol`)** [Dapat paralel dengan Architect setelah PM selesai]
   - Input: `docs/01-features.md`, `docs/02-architecture.md`, dan `uiux_stitch_fintrack.md`.
   - Output: `docs/03-design.md` (peta navigasi layar, state loading/kosong/error/sukses untuk setiap fitur P0, design tokens Tailwind/shadcn, aksesibilitas keyboard & kontras).
4. **Backend System (`model: gpt-6-terra` / varian `Terra`)**
   - Input: `docs/01-features.md`, `docs/02-architecture.md`.
   - Output: Kode lengkap di `backend/` (REST API, JWT + Refresh Token, validasi Zod/DTO, pagination, rate limit, API client untuk frontend) dan `docs/04-api.md` (spesifikasi OpenAPI). Wajib lolos test lokal.
5. **Database Engineer (`model: gpt-5.8-terra` / varian `Terra`)** [Dapat paralel dengan Backend System]
   - Input: `docs/01-features.md`, `docs/02-architecture.md`, `docs/04-api.md`.
   - Output: Skema database PostgreSQL (Prisma/Drizzle) + penyimpanan lokal terenkripsi (IndexedDB/SQLite Web untuk mode offline-first), migrasi teruji, dan `docs/05-database.md`.
6. **QA Engineer (`model: gpt-5.6-luna` / varian `Luna`)**
   - Input: Seluruh kode `frontend/`, `backend/`, dan dokumen `docs/`.
   - Output: Kode automated test (unit, integrasi, UI) dan `docs/06-qa-report.md`. Jalankan siklus uji -> perbaiki -> uji ulang sampai bug P0 dan P1 bernilai 0.
7. **Security Dev (`model: gpt-6.1-astra` / varian `Astra`)**
   - Input: Seluruh kode proyek.
   - Output: `docs/07-security.md` (audit OWASP Top 10, pengecekan hardcoded secrets, SQL injection, broken auth, XSS/CSRF). Perbaiki semua temuan Critical & High hingga nol.
8. **DevOps Engineer (`model: gpt-6-sol` / varian `Sol`)**
   - Input: Kode teruji, `docs/06-qa-report.md`, `docs/07-security.md`.
   - Output: `.gitignore`, `README.md`, `docker-compose.yml`, workflow GitHub Actions (`.github/workflows/client-build.yml` & `.github/workflows/backend-deploy.yml`), dan `docs/08-devops.md` (panduan rilis, daftar GitHub Secrets, prosedur rollback).
9. **Tech Lead (`model: gpt-6.1-astra` / varian `Astra`)**
   - Input: Seluruh hasil kerja Agent 1 sampai 8.
   - Output: `docs/09-review.md` berisi evaluasi per agent dengan status `LOLOS` atau `KEMBALI` beserta daftar perbaikan.

### Aturan Eksekusi Wajib:
- Simpan semua dokumentasi di folder `docs/` dalam repository proyek.
- Terapkan gatekeeping ketat oleh **Tech Lead**: setiap hasil yang tidak sesuai standar atau tidak sinkron antara desain, API, dan database harus dikembalikan ke agent asal (maksimal 3 putaran perbaikan per agent).
- Setelah setiap tahap selesai, laporkan secara ringkas (1–2 kalimat) hasil tahap tersebut dan keputusan Tech Lead sebelum melanjutkan ke tahap berikutnya.
- Hanya tanyakan kepada saya jika ada informasi yang tidak bisa diputuskan sendiri (seperti nama repository GitHub tujuan deploy).
```

---

## 3. Konfigurasi Profil Codex CLI (`~/.codex/config.toml`)

Jika Anda menjalankan Codex melalui terminal (CLI), gunakan profil varian model (`Luna`, `Sol`, `Terra`, `Astra`) berikut pada `~/.codex/config.toml`:

```toml
model = "gpt-6.1-astra"

[profiles.astra_lead]
model = "gpt-6.1-astra"

[profiles.terra_engineering]
model = "gpt-6-terra"

[profiles.sol_design_ops]
model = "gpt-5.8-sol"

[profiles.luna_fast]
model = "gpt-5.6-luna"
```