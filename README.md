<div align="center">

<img src="public/icon.svg" width="88" height="88" alt="Logo FinTrack">

# FinTrack Web

**Catat uang masuk. Pantau uang keluar. Kendalikan anggaran.**

Aplikasi keuangan pribadi berbahasa Indonesia untuk ponsel dan desktop.

[![Client build](https://github.com/Reliaaaa/FinTrack-Web/actions/workflows/client-build.yml/badge.svg?branch=dev)](https://github.com/Reliaaaa/FinTrack-Web/actions/workflows/client-build.yml)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

<a href="https://fintrack-web671.vercel.app/?mode=lokal"><img src="https://img.shields.io/badge/🚀_Coba_Tanpa_Akun-235347?style=for-the-badge" alt="Coba tanpa akun"></a>
<a href="https://fintrack-web671.vercel.app/login"><img src="https://img.shields.io/badge/🔐_Masuk_atau_Daftar-163832?style=for-the-badge" alt="Masuk atau daftar"></a>

[Fitur](#-fitur) · [Tampilan](#-tampilan) · [Cara pakai](#-cara-pakai) · [Instalasi](#-jalankan-di-komputer) · [Dokumentasi](#-dokumentasi)

<br>

<img src="docs/dashboard-desktop.png" alt="Dasbor FinTrack dengan kartu Uang Digital dan Uang Tunai, grafik arus kas, dan pengeluaran per kategori">

<sub>Dasbor dengan data contoh</sub>

</div>

## ✨ Fitur

<table>
<tr>
<td width="50%" valign="top">

### 📊 Dasbor
Lihat kekayaan bersih, saldo uang digital dan tunai, pemasukan, pengeluaran, sisa anggaran, tagihan berikutnya, dan arus kas 6 bulan.

</td>
<td width="50%" valign="top">

### 💸 Transaksi
Catat pemasukan, pengeluaran, dan transfer. Cari dan saring data. Lampirkan foto struk hingga 1 MB.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 👛 Dompet
Pisahkan saldo rekening bank, e-wallet, tunai, dan kartu kredit. Arsipkan dompet yang tidak dipakai.

</td>
<td width="50%" valign="top">

### 🎯 Anggaran
Atur batas bulanan per kategori. Status berubah saat pemakaian mencapai 80% dan 100%.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔁 Tagihan Berulang
Buat jadwal mingguan, bulanan, atau tahunan. Unduh file `.ics` untuk kalender kamu. Mode akun mendukung pencatatan otomatis jika server dan cron sudah dikonfigurasi.

</td>
<td width="50%" valign="top">

### 📈 Laporan
Bandingkan pengeluaran dengan bulan lalu. Lihat 5 pengeluaran terbesar. Ekspor CSV dan Excel, atau simpan PDF lewat dialog cetak.

</td>
</tr>
</table>

### 🏦 Investasi dan Simpanan

Sisihkan dana dari rekening, e-wallet, atau dompet tunai ke simpanan terpisah. Catat penarikan kembali ke dompet saat dibutuhkan. Dana simpanan tetap dihitung dalam kekayaan bersih.

🌗 Tersedia tema terang dan gelap.

## 📱 Tampilan

<div align="center">
  <img src="docs/dashboard-mobile.png" width="320" alt="Dasbor FinTrack di ponsel dengan kartu Uang Digital dan Uang Tunai">
  <br>
  <sub>Tampilan seluler</sub>
</div>

## 🧭 Cara pakai

| | 💻 Mode lokal | ☁️ Mode akun |
| --- | --- | --- |
| **Perlu daftar** | Tidak | Ya |
| **Penyimpanan** | Browser | Server (PostgreSQL) |
| **Akses dari perangkat lain** | Tidak | Ya |
| **Tagihan berulang** | Jadwal dan file kalender | Pencatatan otomatis dengan cron |
| **Mulai** | [Buka mode lokal](https://fintrack-web671.vercel.app/?mode=lokal) | [Daftar akun](https://fintrack-web671.vercel.app/login) |

> [!IMPORTANT]
> Data mode lokal hilang jika kamu membersihkan data browser. Ekspor CSV sebelum berganti perangkat. CSV berisi transaksi saja.

**3 langkah pertama:**

1. Tambahkan atau sesuaikan dompet dan saldo awal.
2. Catat transaksi.
3. Atur anggaran bulanan.

## 🛠️ Teknologi

| Bagian | Teknologi |
| --- | --- |
| Antarmuka | Next.js 15, React 19, TypeScript, CSS, Recharts, Lucide |
| Server | Next.js Route Handlers, Zod, bcryptjs |
| Data | PostgreSQL atau penyimpanan browser |
| Pengujian | Node test runner, Playwright |
| Otomasi | GitHub Actions, Vercel Cron |

```mermaid
flowchart LR
    U([Pengguna]) --> A[Aplikasi FinTrack]
    A -->|Mode lokal| B[(Browser)]
    A -->|Mode akun| C[API Next.js]
    C --> D[(PostgreSQL)]
    E[Vercel Cron] --> F[Proses tagihan berulang]
    F --> D
```

## 🚀 Jalankan di komputer

Siapkan **Node.js 22**.

```bash
git clone https://github.com/Reliaaaa/FinTrack-Web.git
cd FinTrack-Web
npm ci
npm run dev
```

Buka [localhost:3000](http://localhost:3000). Aplikasi berjalan dengan penyimpanan browser jika `DATABASE_URL` kosong.

<details>
<summary><b>🗄️ Aktifkan akun dengan PostgreSQL</b></summary>

<br>

1. Jalankan `docker compose up -d`.
2. Salin `.env.example` ke `.env.local`.
3. Isi `DATABASE_URL` sesuai kredensial di [docker-compose.yml](docker-compose.yml).
4. Jalankan ulang `npm run dev`.

</details>

<details>
<summary><b>⚙️ Konfigurasi deployment</b></summary>

<br>

| Variabel | Fungsi |
| --- | --- |
| `DATABASE_URL` | Akun dan penyimpanan server |
| `CRON_SECRET` | Mengamankan cron transaksi berulang (harian, 08.00 WIB) |
| `APP_URL` | URL publik untuk Google OAuth dan pemulihan kata sandi |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login Google (opsional) |
| `RESEND_API_KEY`, `RESET_FROM_EMAIL` | Email pemulihan kata sandi (opsional) |

- **Google OAuth:** daftarkan callback `APP_URL/api/v1/auth/google/callback`. Akun kata sandi yang sudah ada tidak otomatis tertaut ke Google.
- **Pemulihan kata sandi:** gunakan pengirim terverifikasi dan matikan pelacakan klik di Resend. Tautan berlaku 30 menit untuk sekali pakai.

Baca [panduan deployment dan rollback](docs/08-devops.md). Cek [status layanan produksi](https://fintrack-web671.vercel.app/api/v1/health).

</details>

### 🧪 Pengujian

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:ui
npm run build
```

## Alur kontribusi

Commit dan push ke branch permanen `feature`. Setelah pemeriksaan lulus, gabungkan lewat pull request `feature` → `dev`, lalu `dev` → `main` untuk rilis produksi. [Panduan branch dan rilis](docs/08-devops.md#branch-dan-gate-rilis)

## 📚 Dokumentasi

| Produk dan desain | Teknis | Kualitas |
| --- | --- | --- |
| [Fitur](docs/01-features.md) | [Arsitektur](docs/02-architecture.md) | [Laporan QA](docs/06-qa-report.md) |
| [PRD](docs/reference/PRD.md) | [API](docs/04-api.md) | [Keamanan](docs/07-security.md) |
| [Panduan desain](docs/03-design.md) | [Basis data](docs/05-database.md) | [Catatan tinjauan](docs/09-review.md) |
| [Spesifikasi UI/UX](docs/reference/UI-UX-Stitch.md) | [DevOps](docs/08-devops.md) | |
| [Ekspor Google Stitch](docs/stitch/) | [Prompt pengembangan awal](docs/reference/Codex-master-prompt.md) | |
| [Panduan UI/UX untuk Codex](docs/10-uiux-codex.md) | | |

---

<div align="center">

Dibuat oleh [**Reliaaaa**](https://github.com/Reliaaaa)

⭐ Beri bintang jika FinTrack membantu kamu.

</div>
