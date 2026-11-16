---
name: "fullstack-app-team"
description: "Gunakan setiap kali pengguna meminta dibuatkan aplikasi fullstack (Desktop/Windows, Mobile/Android/iOS, Web, dan backend). Menjalankan 9 agent pembantu secara berurutan."
---
 
# Fullstack App Team
 
Pengguna adalah manajer. Sistem menjalankan 9 agent pembantu. Setiap agent punya tugas, input, output, dan syarat selesai. Jalankan berurutan. Agent yang tidak bergantung satu sama lain boleh paralel (Backend dan Database, Designer dan Architect setelah PM).
 
Gunakan Agent tool untuk setiap peran. Beri tiap agent prompt berisi peran, input dari agent sebelumnya, dan format output. Simpan semua output di folder `docs/` dalam repository proyek.
 
## Stack Default
Sistem harus menanyakan target platform (Windows, Android, iOS, Web, atau Multiplatform) jika pengguna belum menyebutkannya.
- 
Klien/Frontend: Sesuaikan dengan permintaan (misal: React Native/Flutter untuk multiplatform mobile, Tauri/C# .NET/Electron untuk Windows, React/Vue untuk Web, atau native sesuai OS).
- 
Arsitektur Klien: MVVM, MVC, atau Clean Architecture (sesuai best practice framework yang dipilih).
- 
Backend: Node.js, Python (FastAPI/Django), Go, atau Java/Kotlin.
- 
Database di aplikasi (Lokal): SQLite (menggunakan ORM sesuai bahasa klien) dan secure storage untuk pengaturan.
- 
Database server: PostgreSQL.
Ganti stack hanya bila pengguna meminta spesifikasi khusus.
 
## Alur
PM -> Architect -> Designer -> Backend + Database -> QA -> Security -> DevOps -> Tech Lead
Tech Lead menolak pekerjaan yang jelek. Pekerjaan itu kembali ke agent asal sampai lolos.
 
## 1. Project Manager
Tugas: pecah ide menjadi fitur terkecil.
Input: ide pengguna, file yang dikirim pengguna, catatan memori proyek.
Output `docs/01-features.md`:
- 
Daftar fitur terkecil (login, chat, payment, profile, notification, dan seterusnya)
- 
Tiap fitur: ID, deskripsi satu kalimat, prioritas (P0, P1, P2), ketergantungan, kriteria selesai
- 
Urutan rilis: MVP lalu tahap berikutnya
Selesai bila tiap fitur bisa dikerjakan satu orang dalam 1 sampai 3 hari.
## 2. Architect
Tugas: tentukan struktur proyek.
Input: `01-features.md`.
Output `docs/02-architecture.md`:
- 
Struktur modul dan folder (Klien/Frontend, Admin Web, Backend)
- 
Pola arsitektur dan alasan singkat
- 
Diagram alur data
- 
Daftar library/framework utama dengan versinya
- 
Aturan penamaan dan batas antar modul
Selesai bila agent lain bisa membuat file tanpa bertanya soal letak kode.
## 3. Designer
Tugas: alur dan tampilan tiap layar/window.
Input: `01-features.md`, `02-architecture.md`.
Output `docs/03-design.md`:
- 
Peta navigasi antar antarmuka (layar/window)
- 
Per tampilan: tujuan, komponen, state (loading, kosong, error, sukses)
- 
Warna, tipografi, jarak, komponen dasar
- 
Aksesibilitas (kontras, target klik/sentuh adaptif, navigasi keyboard untuk desktop)
Alat: Canva (plugin Canva). Buat desain di Canva dan simpan tautannya di dokumen. Bila Canva tidak tersambung, buat wireframe teks dan beri tahu pengguna.
Selesai bila setiap fitur P0 punya antarmuka lengkap dengan semua state.
## 4. Backend System
Tugas: API dan logika server.
Input: fitur, arsitektur.
Output: kode di `backend/` dan `docs/04-api.md` (OpenAPI):
- 
Endpoint, request, response, kode error
- 
Autentikasi (JWT dengan refresh token atau session base)
- 
Validasi input, pagination, rate limit
- 
Klien API untuk platform target (misal: konfigurasi Axios/Fetch/HttpClient sesuai bahasa klien)
Selesai bila tiap endpoint punya tes dan berjalan lokal.
## 5. Database (Lokal/Klien)
Tugas: penyimpanan lokal pada aplikasi target.
Input: fitur, arsitektur, API.
Output: kode skema database dan `docs/05-database.md`:
- 
Entity, Model, relasi, indeks
- 
Migrasi antar versi dengan tes migrasi
- 
Strategi offline dan sinkronisasi
- 
Enkripsi data sensitif (menggunakan standar OS seperti Credential Manager, Keychain, atau encrypted file)
Selesai bila migrasi lolos tes dan data sensitif terenkripsi.
## 6. QA
Tugas: cari bug sampai tidak ada yang ditemukan lagi.
Input: seluruh kode dan dokumen.
Output `docs/06-qa-report.md`:
- 
Tes unit, integrasi, dan UI (menggunakan testing framework sesuai stack)
- 
Kasus batas: input kosong, jaringan putus, perubahan ukuran window (desktop) / rotasi layar (mobile), data besar
- 
Daftar bug: ID, langkah reproduksi, tingkat keparahan, status
Aturan: ulangi siklus uji, perbaiki, uji ulang. Berhenti hanya bila satu siklus penuh tidak menemukan bug baru. Bug P0 dan P1 nol.
## 7. Security Dev
Tugas: periksa celah keamanan.
Input: seluruh kode.
Output `docs/07-security.md`:
- 
Pemeriksaan OWASP Top 10 (Web/API) dan standar keamanan platform spesifik (Mobile/Desktop)
- 
Rahasia di kode, izin OS (permissions) berlebih, penyimpanan lokal tidak aman
- 
Ketergantungan rentan, SQL injection, otorisasi rusak
- 
Temuan: tingkat, lokasi, perbaikan
Alat: Codex Security (plugin) bila tersambung. Bila tidak, lakukan tinjauan manual dan beri tahu pengguna.
Selesai bila tidak ada temuan Critical atau High yang terbuka.
## 8. DevOps
Tugas: build dan deploy lewat repository GitHub pengguna.
Input: kode, hasil QA, hasil Security.
Langkah:
1. 
Cari repository pengguna lewat tool repo (`list_repos`, `add_repo`). Tanyakan nama repository bila belum jelas.
2. Masukkan seluruh aplikasi ke repository. Gunakan branch `main` dan branch kerja per rilis.
3. Buat `.gitignore`, `README.md`, dan workflow GitHub Actions:
-    
`client-build.yml`: lint, tes, build release, unggah artifact sesuai platform (APK/AAB untuk Android, .exe/.msi untuk Windows, dsb)
-    
`backend-deploy.yml`: tes, build, deploy
4. Simpan rahasia (kunci produksi, kunci API) di GitHub Secrets. Jangan commit rahasia.
5. Setiap build atau deploy yang berjalan, tulis komentar di commit atau pull request lewat GitHub (plugin GitHub):
-    
Status (mulai, sukses, gagal)
-    
Nomor run dan tautan log
-    
Versi, branch, commit SHA
-    
Ringkasan hasil tes
-    
Bila gagal: penyebab dan langkah perbaikan
Output `docs/08-devops.md`: cara rilis, daftar secrets, cara rollback.
Selesai bila satu build penuh berhasil dan komentarnya terkirim.
Bila GitHub tidak tersambung, tulis semua file workflow secara lokal dan minta pengguna menyambungkan GitHub.
## 9. Tech Lead
Tugas: tinjau semua pekerjaan. Yang jelek dikembalikan.
Input: output semua agent.
Output `docs/09-review.md`: per agent, keputusan LOLOS atau KEMBALI, alasan, dan daftar perbaikan.
Periksa:
- 
Kesesuaian dengan fitur dan arsitektur
- 
Kualitas kode, keterbacaan, tes
- 
Konsistensi antara desain, API, dan database
- 
Hasil QA dan Security benar-benar ditutup
Aturan:
- 
Pekerjaan yang KEMBALI dikirim ulang ke agent asal beserta daftar perbaikan
- 
Maksimal 3 putaran per agent. Setelah itu laporkan ke pengguna
- 
Rilis hanya setelah semua agent LOLOS
## Pelaporan ke pengguna
Setelah tiap tahap, laporkan satu sampai dua kalimat: hasil dan keputusan Tech Lead. Tanyakan hanya hal yang tidak bisa diputuskan sendiri (nama repository, target platform jika belum jelas, aset merek).
Akhir proyek: tautan repository, tautan desain, status build artifact (exe/apk/web), dan daftar risiko yang tersisa.