# API FinTrack Web

Seluruh endpoint memakai origin yang sama. Operasi akun memerlukan cookie sesi `fintrack_session` (HTTP-only, SameSite=Lax; Secure di produksi). Permintaan penulisan harus memakai `Content-Type: application/json` dan `Origin` yang sama dengan host. `user_id` tidak diterima dari browser; server mengambilnya dari sesi. Respons bootstrap dan pembacaan data akun memakai `Cache-Control: private, no-store`.

## OpenAPI 3.1 (kontrak rilis ini)

```yaml
openapi: 3.1.0
info:
  title: FinTrack Web API
  version: 0.1.0
servers:
  - url: /
components:
  securitySchemes:
    session:
      type: apiKey
      in: cookie
      name: fintrack_session
    cronSecret:
      type: http
      scheme: bearer
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error: { type: string }
    Wallet:
      type: object
      required: [id, name, type, openingBalance, color]
      properties:
        id: { type: string }
        name: { type: string, minLength: 1, maxLength: 100 }
        type: { enum: [bank, ewallet, cash, credit] }
        openingBalance: { type: number, minimum: 0 }
        color: { type: string, pattern: '^#[0-9a-fA-F]{6}$' }
        archived: { type: boolean }
    Entry:
      type: object
      required: [id, type, amount, walletId, category, title, date]
      properties:
        id: { type: string }
        type: { enum: [income, expense, transfer] }
        amount: { type: number, exclusiveMinimum: 0 }
        walletId: { type: string }
        targetWalletId: { type: string }
        category: { type: string }
        title: { type: string }
        note: { type: string, maxLength: 500 }
        date: { type: string, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
        receipt: { type: string, description: 'Data URL PNG/JPEG/WebP; maksimal 1,5 juta karakter' }
    Budget:
      type: object
      required: [id, category, limit]
      properties:
        id: { type: string }
        category: { type: string }
        limit: { type: number, exclusiveMinimum: 0 }
        period: { type: string, description: 'YYYY-MM; opsional hanya untuk data lama' }
    Recurring:
      type: object
      required: [id, title, type, amount, walletId, category, frequency, nextDate, active]
      properties:
        id: { type: string }
        title: { type: string }
        type: { enum: [income, expense] }
        amount: { type: number, exclusiveMinimum: 0 }
        walletId: { type: string }
        category: { type: string }
        frequency: { enum: [weekly, monthly, yearly] }
        nextDate: { type: string, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
        anchorDay: { type: integer, minimum: 1, maximum: 31, description: 'Tanggal asal jadwal agar akhir bulan konsisten' }
        active: { type: boolean }
    FinanceData:
      type: object
      required: [name, wallets, entries, budgets, recurring]
      properties:
        name: { type: string, minLength: 1, maxLength: 60 }
        wallets: { type: array, maxItems: 100, items: { $ref: '#/components/schemas/Wallet' } }
        entries: { type: array, maxItems: 10000, items: { $ref: '#/components/schemas/Entry' } }
        budgets: { type: array, maxItems: 200, items: { $ref: '#/components/schemas/Budget' } }
        recurring: { type: array, maxItems: 500, items: { $ref: '#/components/schemas/Recurring' } }
paths:
  /api/v1/bootstrap:
    get:
      summary: Status konfigurasi dan snapshot akun
      responses:
        '200': { description: 'Demo {configured:false} atau akun {configured:true,data,version}; akun private, no-store' }
        '401': { description: 'Database aktif tetapi belum masuk' }
        '503': { description: 'Database tidak tersedia' }
  /api/v1/auth/register:
    post:
      summary: Buat akun dan sesi
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, email, password]
              properties:
                name: { type: string, minLength: 1, maxLength: 60 }
                email: { type: string, format: email }
                password: { type: string, minLength: 8, maxLength: 128 }
      responses:
        '201': { description: 'Akun dibuat; cookie sesi dikirim' }
        '400': { description: 'JSON atau field tidak valid' }
        '403': { description: 'Origin tidak cocok' }
        '413': { description: 'Body melebihi 4 KiB' }
        '409': { description: 'Email sudah terdaftar' }
        '429': { description: 'Terlalu banyak percobaan' }
        '503': { description: 'Database belum dikonfigurasi' }
  /api/v1/auth/login:
    post:
      summary: Masuk ke akun
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200': { description: 'Cookie sesi dikirim' }
        '400': { description: 'JSON atau field tidak valid' }
        '401': { description: 'Email atau kata sandi salah' }
        '403': { description: 'Origin tidak cocok' }
        '413': { description: 'Body melebihi 4 KiB' }
        '429': { description: 'Terlalu banyak percobaan' }
        '503': { description: 'Database belum dikonfigurasi' }
  /api/v1/auth/logout:
    post:
      summary: Cabut sesi saat ini
      security: [{ session: [] }]
      responses:
        '200': { description: 'Sesi dihapus' }
  /api/v1/data:
    get:
      summary: Ambil snapshot dan versi akun
      security: [{ session: [] }]
      responses:
        '200': { description: '{data: FinanceData, version: string}; private, no-store' }
        '401': { description: 'Sesi tidak valid' }
        '503': { description: 'Database belum dikonfigurasi' }
    put:
      summary: Ganti snapshot secara atomik jika versi masih cocok
      security: [{ session: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [version, data]
              properties:
                version: { type: string, pattern: '^\\d+$', description: 'Versi dari bootstrap atau GET data' }
                data: { $ref: '#/components/schemas/FinanceData' }
      responses:
        '200': { description: '{ok:true, version:string}; versi baru setelah simpan' }
        '400': { description: 'Data atau versi tidak valid' }
        '401': { description: 'Sesi tidak valid' }
        '403': { description: 'Origin tidak cocok' }
        '404': { description: 'Data akun tidak ditemukan' }
        '409': { description: '{error,version}; snapshot server berubah, data klien tidak ditulis' }
        '413': { description: 'Body melebihi 5 MB' }
        '503': { description: 'Database belum dikonfigurasi' }
  /api/v1/health:
    get:
      summary: Status aplikasi/database
      responses:
        '200': { description: 'Demo atau database terhubung' }
        '503': { description: 'Database tidak tersedia' }
  /api/cron/recurring:
    get:
      summary: Bukukan jadwal berulang yang jatuh tempo (08.00 WIB)
      security: [{ cronSecret: [] }]
      responses:
        '200': { description: '{status,created}' }
        '401': { description: 'Bearer token salah atau tidak ada' }
```

## Perilaku konflik

PostgreSQL menaikkan `finance_data.version` pada `PUT` dan cron. Browser hanya mengirim `PUT` dengan versi terakhir yang diterima. Jika versi sudah berubah, server mengembalikan `409` tanpa mengubah data. Browser mempertahankan perubahan lokal dalam memori dan `sessionStorage` (`fintrack-pending-change:<user-id>`), menampilkan pemberitahuan, serta menawarkan unduh draf JSON sebelum memuat snapshot server terbaru. Draf tidak digabung otomatis agar tidak menimpa transaksi dari tab lain.

Nominal adalah angka rupiah tanpa sen; tanggal memakai `YYYY-MM-DD`. Kode saat ini memakai satu endpoint dokumen, belum endpoint granular dan paginasi server yang tercantum pada PRD.
Body JSON login dan registrasi dibatasi 4 KiB, sedangkan `PUT /api/v1/data` dibatasi 5 MB, termasuk bila `Content-Length` tidak dikirim. Percobaan login dibatasi 20 kali per IP dan 10 kali per email; registrasi 10 kali per IP dan 5 kali per email dalam jendela 15 menit.
