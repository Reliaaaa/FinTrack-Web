# Database dan penyimpanan lokal

Implementasi saat ini memakai PostgreSQL untuk akun dan satu snapshot keuangan per pengguna. Skema pertama dibuat secara idempoten oleh `src/server/db.ts` pada akses server pertama; [`migrations/001_initial.sql`](../migrations/001_initial.sql) adalah padanan SQL untuk instalasi manual. [`migrations/002_snapshot_version.sql`](../migrations/002_snapshot_version.sql) menambah nomor versi secara kompatibel pada instalasi lama; `ensureSchema()` juga menjalankan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` sehingga server baru dapat membuka database lama. Salin database sebelum migrasi pada lingkungan yang berisi data nyata.

## Model server

| Tabel | Kunci dan kolom penting | Relasi dan indeks |
| --- | --- | --- |
| `users` | `id` UUID PK, `email` unik, `name`, `password_hash`, `created_at` | Satu pengguna memiliki banyak sesi; email diindeks oleh constraint unik. |
| `sessions` | `token_hash` CHAR(64) PK, `user_id`, `expires_at`, `created_at` | FK `user_id → users.id ON DELETE CASCADE`; indeks `sessions_user_idx`. Token mentah hanya berada di cookie HTTP-only. |
| `finance_data` | `user_id` UUID PK, `data` JSONB, `version` BIGINT mulai 1, `updated_at` | FK `user_id → users.id ON DELETE CASCADE`. Satu snapshot per pengguna. |
| `auth_attempts` | `key` TEXT PK, `attempts`, `window_start` | Kunci adalah hash dari IP/konteks login; dipakai untuk batas 15 menit. |

Di dalam `finance_data.data` terdapat `name`, `wallets[]`, `entries[]`, `budgets[]`, dan `recurring[]`. ID dompet pada transaksi/jadwal dan ID tujuan transfer divalidasi oleh Zod, bukan foreign key PostgreSQL. Nominal disimpan sebagai angka rupiah tanpa sen. Saldo dompet dihitung dari `openingBalance` dan semua entri; tidak ada kolom saldo tersimpan yang harus disinkronkan. `version` wajib naik setiap kali snapshot diubah oleh klien atau cron. Endpoint klien mengirim versi yang dibaca; versi lama harus menghasilkan HTTP 409 agar tab lama tidak menimpa transaksi cron atau tab lain.

## Migrasi dan pemeriksaan

Untuk instalasi baru, `ensureSchema()` membuat semua tabel termasuk `version`. Untuk instalasi lama, jalankan SQL migrasi sebelum atau bersamaan dengan deploy aplikasi baru:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/002_snapshot_version.sql
```

Setelahnya, cek bahwa baris lama mendapat versi 1 dan tidak berubah isinya:

```sql
SELECT COUNT(*) AS rows_without_version FROM finance_data WHERE version IS NULL;
SELECT user_id, version, updated_at FROM finance_data LIMIT 5;
```

`rows_without_version` harus 0. Migrasi ini tidak menulis ulang JSONB. Tidak ada server PostgreSQL yang tersedia pada workspace pengembangan saat dokumen ini dibuat, sehingga migrasi dan operasi API belum diuji secara integrasi di database nyata. Unit test yang memeriksa saldo dan tanggal jadwal ada di `tests/finance.test.mjs`; uji migrasi nyata harus masuk gate rilis ketika koneksi database tersedia.

## Lokal, offline, dan sinkronisasi

Mode demo memakai `localStorage` dengan key `fintrack-demo-v1`. Ini hanya untuk contoh dan bukan penyimpanan terenkripsi; pengguna lain yang memiliki akses browser/profil yang sama dapat membaca data. Jangan simpan data sensitif nyata di mode demo. Draf konflik akun disimpan sementara di `sessionStorage` per tab dan hilang saat tab ditutup. Browser tidak mempunyai antrean penulisan offline untuk akun server. Service worker hanya meng-cache shell dan berkas statik, tidak respons `/api/`. Jika jaringan/DB gagal, UI harus menunjukkan kegagalan dan tidak menyatakan perubahan tersinkron.

Model snapshot dengan nomor versi mencegah overwrite diam-diam, tetapi konflik belum digabungkan otomatis. Saat skala naik, pindahkan `wallets`, `transactions`, `budgets`, dan `recurring_transactions` ke tabel relasional dengan FK, operasi CRUD granular, dan indeks `(user_id, transaction_date DESC)` untuk filter/paginasi server. Foto struk harus dipindahkan dari data URL JSONB ke object storage dengan akses terbatas. Jadwalkan backup PostgreSQL harian melalui penyedia database dan uji pemulihannya.
