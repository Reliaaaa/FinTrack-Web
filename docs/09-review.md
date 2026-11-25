# Review Tech Lead — FinTrack Web

**Keputusan pada 25 November 2026:** **KEMBALI untuk rilis mode akun/produksi penuh.** **Demo publik berbasis data lokal lolos QA lokal.** Rilis mengikuti CI pada commit rilis serta verifikasi deployment Vercel pada URL publik. Cakupan PRD dan item yang belum selesai tercatat dalam [backlog fitur](01-features.md).

## Penilaian per peran

| Peran | Keputusan untuk demo | Keputusan untuk mode akun | Bukti dan pekerjaan tersisa |
| --- | --- | --- | --- |
| PM | **LOLOS** | **KEMBALI** | [Backlog](01-features.md) memisahkan P0/P1/P2. Backlog mencatat hasil PostgreSQL lokal dan konfigurasi layanan yang masih diperlukan. |
| Architect | **LOLOS** | **KEMBALI** | Snapshot JSONB berversi membatasi overwrite; UI kini menyamarkan data pada sinyal sesi lintas tab dan memeriksa ID akun melalui `/api/v1/auth/me`. Model data masih belum punya paginasi server atau indeks transaksi. |
| Designer | **LOLOS** | **KEMBALI** | UI memakai opsi autentikasi yang sesuai dengan konfigurasi. Chromium lulus termasuk tampilan saat verifikasi lintas tab. Audit aksesibilitas menyeluruh masih terbuka. |
| Backend | **LOLOS bersyarat** | **KEMBALI** | Sesi HTTP-only, pemeriksaan Origin, query berdasarkan sesi, batas body, rate limit, `accountId` pada PUT, serta endpoint `/auth/me` terlihat di kode. Tes akun pada PostgreSQL lokal lulus. Google OAuth dan Resend diuji dengan mock. |
| Database | **LOLOS untuk lokal** | **KEMBALI** | `scripts/check-database.mjs` telah lulus terhadap PostgreSQL lokal menurut hasil pengujian tim: kesetaraan skema runtime/migrasi, migrasi ulang, data lama, versi usang, dan cron idempoten. Ini belum membuktikan konfigurasi, backup, atau pemulihan database produksi. Migrasi autentikasi terdapat di `003_auth_providers.sql`. |
| QA | **LOLOS** | **KEMBALI** | [Laporan QA](06-qa-report.md) mencatat 13 tes unit, 8 tes Chromium, dan 7 tes integrasi PostgreSQL lulus. Penyedia nyata dan database Vercel perlu diuji setelah konfigurasi. |
| Security | **LOLOS bersyarat untuk demo** | **KEMBALI** | Temuan tampilan akun lama lintas tab sudah ditangani secara statis: sinyal tanpa data sensitif, konten disembunyikan saat verifikasi, `401/412` menutup tampilan, dan PUT silang akun ditolak. Uji regresi browser dan PostgreSQL lokal lulus. Penyedia OAuth/email dan konfigurasi proxy akun perlu diverifikasi pada lingkungan tujuan. |
| DevOps | **KEMBALI hingga CI/deploy selesai** | **KEMBALI** | [Panduan operasi](08-devops.md) mencatat proyek Vercel, branch gate, dan staging lama. Belum ada bukti bahwa working tree ini lulus CI remote atau tayang pada URL publik tetap. Rahasia database dan layanan auth belum tersedia di Vercel. |

## Penghalang konkret

1. **Temuan batas akun lintas tab — lulus uji regresi.** Tinjauan awal menemukan tab A tetap merender data lama setelah tab lain beralih ke akun B. Perubahan working tree kini menulis sinyal `localStorage` yang tidak berisi data akun, menyembunyikan konten selama `/api/v1/auth/me` memeriksa sesi, memeriksa ulang saat fokus/visibility, dan mengosongkan tampilan saat akun berbeda, sesi hilang, atau respons PUT `401/412`. Jika verifikasi setelah sinyal gagal, UI juga menutup tampilan akun. Tes dua tab membuktikan data disembunyikan selama pemeriksaan sesi dan layar masuk tampil saat akun berganti.
2. **P0 untuk produksi akun — penyedia dan operasi belum terbukti.** Implementasi OAuth Google, reset melalui Resend, dan migrasi tabel auth ada di kode, tetapi belum ada `APP_URL`, kredensial penyedia, domain pengirim terverifikasi, atau tes login/reset nyata pada deployment. Tanpa konfigurasi ini, UI menyembunyikan opsi tersebut. Database produksi, backup, dan uji pemulihan juga belum tersedia. Jangan menyebut rilis ini layanan akun keuangan siap pakai.
3. **Gate demo publik — versi terbaru belum diverifikasi remote.** Tunggu QA penuh, CI hijau pada SHA yang benar, deployment Vercel Ready dari SHA itu, serta pemeriksaan tujuh route dan `/api/v1/health` pada URL tanpa login. Staging Ready yang tercatat di [DevOps](08-devops.md) berasal dari commit lama dan tidak membuktikan perubahan working tree ini.

## Risiko yang diterima hanya untuk demo

Demo menyimpan data di `localStorage` browser tanpa enkripsi atau sinkronisasi; banner UI menyatakannya. Mode demo tidak memakai akun, OAuth, atau email. Jalur ini dapat dipakai sebagai pratinjau desain dan alur keuangan setelah gate di atas lulus. Snapshot akun memakai compare-and-swap versi dan draf konflik di `sessionStorage`, tetapi belum menggabungkan konflik otomatis. Penyimpanan struk di JSONB dan skala data besar tetap masuk backlog.

**Rekomendasi rilis:** verifikasi perbaikan lintas tab pada QA/CI sebelum mengaktifkan mode akun publik. Jika environment layanan eksternal belum ada, deploy hanya demo dengan `DATABASE_URL` kosong dan label demo tetap terlihat; verifikasi deployment dan CI sebelum membagikan URL tetap.
