# Panduan Git Workflow & Branching Strategy

> Referensi awal. FinTrack Web sekarang memakai [tiga branch permanen dan alur rilis terbaru](../08-devops.md#branch-dan-gate-rilis).

Dokumen ini menjelaskan alur kerja (workflow) standar untuk pengelolaan versi kode menggunakan Git. Tujuannya adalah untuk menjaga agar repository tetap rapi, meminimalisir *bug* di tahap produksi, dan mempermudah kolaborasi tim.

---

## 🌳 Arsitektur Branch (Percabangan)

Untuk menjaga kesederhanaan dan kestabilan, kita hanya menggunakan **3 jenis branch utama**:

1. **`main`**: Branch utama yang berisi kode paling stabil dan siap rilis ke tahap *Production*. 
2. **`dev`**: Branch pengembangan utama. Semua fitur baru akan digabungkan (merge) ke sini terlebih dahulu untuk pengujian.
3. **`hotfix`**: Branch darurat yang dibuat langsung dari `main` khusus untuk memperbaiki *bug* kritis atau *error* di tahap *Production* secepat mungkin.

*(Catatan: Saat membuat fitur baru, buatlah temporary branch dari `dev` dengan format `feature/nama-fitur`)*.

---

## 🔄 Tahapan Workflow (Langkah demi Langkah)

### 1. Plan (Perencanaan)
Sebelum mulai menulis kode, pastikan persiapan sudah matang:
* **Plan Aplikasi:** Pahami spesifikasi fitur yang akan dibuat.
* **Setup Repo & `.gitignore`:** Pastikan repository sudah diatur dengan benar dan file `.gitignore` sudah mencakup file/folder yang tidak perlu di-track (seperti `node_modules`, `.env`, dll).
* **Buat Branch Baru:** **Selalu** buat branch baru setiap kali mengerjakan fitur baru. Jangan pernah ngoding langsung di `dev` atau `main`.
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/nama-fitur-kamu
  ```

### 2. Commit (Simpan Perubahan)
Lakukan commit dengan prinsip **Kecil tapi Sering (Small and Frequent)**.
* Membantu mempermudah pencarian sumber *bug* jika terjadi kesalahan.
* Jika kode rusak dan tidak bisa di-run, akan sangat mudah untuk dikembalikan (revert) ke versi commit sebelumnya yang masih berfungsi.
* Gunakan pesan commit yang deskriptif.

### 3. Push (Kirim ke Remote Repository)
Setelah di-commit, push perubahan Anda **hanya ke branch fitur Anda sendiri**.
* Dilarang keras melakukan push secara langsung (direct push) ke branch `main` atau `dev`.
  ```bash
  git push origin feature/nama-fitur-kamu
  ```

### 4. PR (Pull Request)
Setelah fitur selesai, buat Pull Request (PR) dari branch `feature` Anda menuju ke branch `dev`.
* PR wajib di-cek (Code Review) oleh anggota tim lain atau AI Reviewer.
* Tujuannya adalah untuk mencari *bug* yang terlewat, potensi celah keamanan, atau kode yang tidak efisien sebelum benar-benar digabungkan.

### 5. CI (Continuous Integration)
Setiap PR yang dibuat akan memicu otomatisasi pengecekan (CI Pipeline).
* Sistem CI akan menjalankan: **Linting** (cek standar kode), **Testing** (unit/integration test), dan **Build**.
* **Syarat Merge:** Kode hanya bisa di-merge jika SEMUA proses CI berhasil (Hijau).
* **Jika Gagal (Merah):** Dilarang memaksakan merge. Developer harus mencari kesalahan di PR tersebut, memperbaikinya, dan melakukan commit ulang hingga CI berhasil.

### 6. Deploy (Penggabungan & Pengujian Manual)
Proses merge dari PR tidak boleh berjalan otomatis begitu saja.
* Harus dilakukan secara **manual oleh user/reviewer** yang berwenang.
* Fitur harus dites (di environment testing/lokal) untuk memastikan apakah sudah berjalan sesuai harapan.
* Jika sudah dipastikan aman dan sukses, barulah PR di-approve dan di-merge.

### 7. Release (Staging & Production)
Siklus rilis aplikasi mengikuti alur berikut:
* **Branching & Staging:** Saat branch `dev` dirasa sudah memiliki fitur yang cukup dan stabil, kode akan diuji terlebih dahulu di environment **Staging**. Staging adalah replika dari Production untuk pengujian akhir.
* **Merge `main` to Production:** Jika semua fitur di Staging sudah lolos Quality Assurance (QA) tanpa masalah, branch `dev` akan di-merge ke branch `main`. Setelah itu, branch `main` siap untuk di-deploy (Release) secara resmi ke environment **Production**.

---
*Dibuat untuk menjaga kualitas, keamanan, dan struktur kode aplikasi.*
