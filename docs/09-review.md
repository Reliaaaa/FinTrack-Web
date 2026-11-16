# Review Tech Lead — FinTrack Web

**Keputusan:** **LOLOS untuk preview demo interaktif** dengan mode data lokal, setelah build deployment dan URL preview diverifikasi. **KEMBALI untuk rilis produksi penuh sesuai PRD.** Keputusan ini menilai hasil kerja yang tersedia pada 16 November 2026; status tes lokal berasal dari `docs/06-qa-report.md`, bukan hasil CI atau database produksi. Preview demo tidak boleh dipromosikan sebagai layanan akun keuangan siap pakai.

| Peran | Preview demo | Produksi penuh | Alasan dan tindak lanjut |
| --- | --- | --- | --- |
| PM | **LOLOS** | **KEMBALI** | `docs/01-features.md` memisahkan P0/P1/P2 dan menyatakan status parsial. P0-03, P0-04, dan P0-15 masih terbuka; selesaikan sebelum menutup lingkup MVP akun pribadi. |
| Architect | **LOLOS** | **KEMBALI** | `docs/02-architecture.md` menjelaskan Next.js, batas server, snapshot berversi, konflik 409, dan mode demo. Penyimpanan seluruh transaksi dalam satu JSONB belum mendukung operasi granular, indeks transaksi, dan paginasi server untuk data besar; tetapkan migrasi model sebelum klaim skala produksi. |
| Designer | **LOLOS** | **KEMBALI** | `docs/03-design.md` dan tujuh route menyediakan layout responsif, state form, filter, anggaran bulanan, dan navigasi mobile. Alur Google OAuth/lupa kata sandi belum tersedia; audit aksesibilitas dan kontras menyeluruh masih terbuka. |
| Backend | **LOLOS** | **KEMBALI** | `docs/04-api.md` dan kode memiliki sesi email/password, validasi, batas request, otorisasi berbasis sesi, dan compare-and-swap versi. Kontrak OpenAPI kini memuat `Budget.period` dan `Recurring.anchorDay`; cron membawa tanggal asal saat menghitung periode berikutnya. Google OAuth/reset dan uji API akun pada PostgreSQL nyata masih terbuka. |
| Database | **LOLOS** | **KEMBALI** | `docs/05-database.md`, migrasi SQL, dan `finance_data.version` menjelaskan skema dan konflik. Migrasi, isolasi antar-pengguna, cron, backup, serta pemulihan belum diuji pada PostgreSQL nyata; struk masih data URL di JSONB. |
| QA | **LOLOS** | **KEMBALI** | `docs/06-qa-report.md` mencatat 8 tes unit, 3 tes UI, typecheck/build, empat lebar viewport, dan simulasi 409/500 lulus. Tes unit tanggal 31 Januari → 28 Februari → 31 Maret dan tahun kabisat kini lulus; `npm test` (8/8) dan `npm run typecheck` lulus saat review ulang. Integrasi PostgreSQL, pengukuran Lighthouse/Core Web Vitals, beban data besar, dan audit aksesibilitas belum dilakukan. |
| Security | **LOLOS** | **KEMBALI** | `docs/07-security.md` mencatat perbaikan dependency dan body limit, audit npm tanpa temuan, serta kontrol sesi/CSRF. Review masih manual; batas otorisasi akun, rate limit, cron, konfigurasi proxy, dan keamanan penyimpanan riil perlu diuji pada hosting dan database. |
| DevOps | **LOLOS** | **KEMBALI** | `docs/08-devops.md`, workflow CI, Docker Compose, dan konfigurasi Vercel tersedia. Hasil CI remote, build preview Vercel, health endpoint terpasang, rahasia runtime, backup, serta rollback produksi belum diverifikasi. Preview dinyatakan siap dilihat hanya setelah deployment berstatus Ready. |

## Temuan yang perlu ditutup

1. **P0 — autentikasi wajib PRD:** Google OAuth dan pemulihan kata sandi belum ada (`P0-03`, `P0-04`). Ini menghalangi klaim MVP akun pribadi sesuai PRD, tetapi tidak menghalangi preview demo lokal.
2. **P0 — data akun nyata belum tervalidasi:** belum ada uji end-to-end registrasi → transaksi → reload → login ulang, isolasi akun, migrasi, dan konflik/cron pada PostgreSQL nyata (`P0-05`, `P0-15`). Konfigurasi database produksi dan backup/pemulihan juga belum ada. Jangan gunakan preview demo untuk data keuangan riil.
3. **P1 — skala data:** filter/paginasi masih di browser dan snapshot JSONB membatasi skala (`P0-10`, `P1-09`). Migrasi ke operasi transaksi granular, indeks, dan paginasi server masih diperlukan untuk data akun besar.

**Temuan P1 yang sudah ditutup:** jadwal bulanan/tahunan sekarang menyimpan `anchorDay`, sehingga 31 Januari → 28 Februari → 31 Maret dan 29 Februari → 28 Februari → 29 Februari pada tahun kabisat berikutnya. Tes unit untuk dua siklus tersebut lulus; eksekusi cron tetap perlu dibuktikan pada PostgreSQL nyata. OpenAPI `Budget.period` serta `Recurring.anchorDay` sudah sesuai dengan validasi server.

Untuk preview, pemeriksaan akhir adalah CI branch fitur lulus, deployment Vercel **Ready**, tujuh route dapat dibuka, dan `/api/v1/health` mengembalikan status `demo` ketika `DATABASE_URL` tidak diisi. Sampai pemeriksaan remote tersebut dilakukan, keputusan preview bersifat **siap dipasang**, bukan bukti sudah tayang. Fitur P1/P2 yang belum selesai tetap tercantum di backlog; review ini tidak menyatakan seluruh PRD selesai.
