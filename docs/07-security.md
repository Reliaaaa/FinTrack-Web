# Tinjauan keamanan FinTrack Web

**Cakupan:** kode aplikasi `src/`, konfigurasi Next/Vercel, service worker, serta dependensi npm. Ekspor Stitch di `docs/stitch/` adalah referensi desain dan tidak dijalankan oleh aplikasi. Saya meninjau jalur masuk pengguna, batas sesi, penulisan data, cron, serta ekspor. Tool preflight Codex Security Standard tidak tersedia di lingkungan ini; laporan ini adalah **tinjauan manual berbasis kode**, bukan hasil pemindaian otomatis atau pentest.

## Temuan dan perbaikan

| ID | Tingkat | Bukti dan dampak | Status |
| --- | --- | --- | --- |
| SEC-01 | Tinggi (dependency) | `next@15.5.29` membawa `postcss@8.4.31` yang tercatat pada advisory traversal/source map, termasuk GHSA-6g55-p6wh-862q dan GHSA-r28c-9q8g-f849. Jalur aplikasi memproses CSS statis pada build, sehingga eksploitasi memerlukan input CSS tidak tepercaya; tetap perlu versi aman. | **Diperbaiki:** override `postcss@8.5.33` di `package.json`/lockfile. `npm audit` kini 0 temuan. |
| SEC-02 | Sedang | `PUT /api/v1/data` hanya memeriksa `Content-Length`; body chunked/tanpa header dapat dibaca tanpa batas sebelum validasi, menghabiskan memori fungsi. Login/registrasi juga membaca JSON tanpa batas. | **Diperbaiki:** `readBoundedJson` membatasi streaming hingga 5 MB untuk data dan 4 KB untuk auth, mengembalikan 413. Tes untuk body tanpa `Content-Length` lulus. |
| SEC-03 | Sedang | Pembatasan login berbasis IP mengambil `x-forwarded-for`; header tersebut dapat dipalsukan dalam beberapa topologi proxy sehingga brute force terhadap satu akun dapat menghindari limit IP. | **Diperbaiki sebagian:** gunakan alamat terakhir yang ditambahkan proxy dan tambah batas per email (10 login / 15 menit, 5 registrasi / 15 menit). Tetap validasi konfigurasi proxy dan firewall pada hosting. |
| SEC-04 | Sedang | Draf konflik akun semula disimpan permanen di `localStorage`, sehingga data keuangan tetap berada di browser setelah sesi berakhir. | **Diperbaiki sebagian:** draf akun memakai `sessionStorage`, bertahan saat reload tab namun hilang saat tab ditutup. Mode demo tetap memakai `localStorage` dan diberi label eksplisit. |
| SEC-05 | Rendah | Respons bootstrap/data pribadi belum memiliki `Cache-Control` eksplisit. | **Diperbaiki:** respons sukses memakai `private, no-store`. |

## Kontrol yang sudah ada

- Kata sandi di-hash memakai bcrypt dengan 12 rounds; token sesi acak 32 byte disimpan sebagai hash SHA-256 di PostgreSQL. Cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` saat produksi; logout mencabut sesi di database.
- Semua query dari input pengguna memakai parameter PostgreSQL. `PUT /api/v1/data` memilih `user_id` dari sesi, memvalidasi bentuk data dengan Zod, dan menolak referensi dompet yang tidak ada. Penulisan menggunakan versi snapshot untuk mendeteksi konflik.
- Mutasi API memeriksa header `Origin` terhadap host dan skema; cron memerlukan `CRON_SECRET` ketika database aktif. Tidak ada endpoint akun yang mengembalikan hash kata sandi atau token sesi.
- CSV menetralkan awalan formula spreadsheet, XLSX menulis teks sebagai `inlineStr`, dan HTML UI memakai escaping React. CSP membatasi sumber, objek, frame, dan formulir. Service worker tidak meng-cache `/api/`.
- Foto struk dibatasi 1 MB pada UI dan data URL PNG/JPEG/WebP pada validasi server; data tidak dirender kembali sebagai HTML.

## Risiko dan batas pengujian

- PostgreSQL nyata tidak tersedia untuk uji otorisasi silang akun, migrasi, pembatasan percobaan, atau cron. Klaim keamanan backend hanya berasal dari pembacaan kode dan tes unit batas body.
- CSP masih mengizinkan `'unsafe-inline'` untuk skrip dan style karena prerender/hidrasi Next.js dan style grafik. Nonce per permintaan perlu dirancang untuk CSP yang lebih kuat.
- `sessionStorage` draf konflik dan `localStorage` demo tidak terenkripsi terhadap skrip same-origin atau orang dengan akses ke profil browser. Jangan simpan data keuangan penting dalam mode demo.
- Foto struk masih berada di JSONB, bukan object storage dengan ACL dan retensi terpisah. Kategori, audit trail, dan verifikasi email belum tersedia. Alur Google OAuth memakai state cookie dan menolak penautan otomatis ke akun kata sandi dengan email sama; reset kata sandi memakai token sekali pakai yang di-hash, berlaku 30 menit, dan mencabut sesi lama. Keduanya masih perlu uji integrasi dengan Google/Resend/PostgreSQL nyata serta pemeriksaan keamanan provider di deployment.
- Rate limit per email membatasi percobaan, tetapi dapat menyebabkan penolakan layanan pada email target. Tabel `auth_attempts` belum memiliki pembersihan berkala. Konfigurasi firewall dan backup database perlu diverifikasi di hosting.
- Audit dependensi (`npm audit`) melaporkan **0 vulnerabilities** setelah override; hasil ini tidak menggantikan pentest aplikasi.

## Verifikasi lokal

`npm run typecheck`, `npm test` (7 tes), `npm run test:ui` (3 tes), dan `npm run build` lulus setelah perubahan. `npm audit --audit-level=moderate` melaporkan 0 vulnerabilities. Tidak ada kredensial produksi di kode; hanya placeholder pada `.env.example`.
