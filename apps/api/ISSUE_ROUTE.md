# Route Test Failure Report

Dokumen ini merangkum kegagalan pada pengujian layer transport (HTTP) untuk file `route.ts`. Dari 31 test yang dijalankan, **27 test gagal**.

## Ringkasan Eksekusi
- **Total Test:** 31
- **Passed:** 4
- **Failed:** 27
- **Error Utama:** 422 Unprocessable Content, 500 Internal Server Error, dan rate-limit warnings.

---

## 1. Daftar Kegagalan Utama

### A. Status 422 (Unprocessable Content)
Hampir semua modul (`Brilink`, `Products`, `Categories`, `Users`, `Transactions`) menghasilkan error 422.
- **Penyebab:** 
    1. **Auth Context:** `authPlugin` menggunakan `.derive()` untuk mengambil `tenantId`, `userId`, dan `role`. Meskipun plugin di-mock, Elysia tetap menjalankan validasi schema pada layer parameter/query/body yang mungkin secara implisit mengharapkan data tersebut atau gagal mem-bypass middleware dengan benar.
    2. **Schema Mismatch:** Data yang dikirim dalam test (params UUID, query string, body) tidak lolos validasi TypeBox. Misalnya, mengirim `uuid` padahal schema mengharapkan format UUID asli, atau mengirim `sellingPrice` sebagai number padahal di schema adalah string (numeric).
    3. **Missing Headers:** Header `Authorization: Bearer mock-token` seringkali tidak disertakan secara konsisten di semua request yang di-guard.

### B. Status 500 (Internal Server Error)
Terjadi pada module `Auth` khususnya endpoint `/refresh` dan `/logout`.
- **Penyebab:** 
    1. **JWT/Cookie Mocking:** Fungsi JWT (`sign`, `verify`) dan manajemen Cookie Elysia tidak berjalan sempurna di dalam `app.handle` jika tidak di-mock secara mendalam di level instance aplikasi.
    2. **Dependency Leakage:** Route mencoba mengakses properti pada `cookie` yang bernilai `undefined`.

### C. Rate Limit Warning
Muncul pesan `[elysia-rate-limit] failed to determine client address`.
- **Penyebab:** Plugin `elysia-rate-limit` mencoba mengambil alamat IP client menggunakan `server.requestIP`, namun dalam lingkungan `bun:test` dengan `app.handle()`, objek `server` tidak tersedia (undefined).

---

## 2. Rencana Perbaikan

### Strategi 1: Memperbaiki Mock Auth secara Global
Alih-alih mem-mock plugin di level module, kita akan menyuntikkan data context langsung menggunakan `.derive()` atau `.state()` di instance Elysia test agar semua route di bawahnya mendapatkan `userId` dan `tenantId` tanpa harus melewati logika JWT yang kompleks.

```typescript
// Contoh perbaikan instance app di test
const app = new Elysia()
  .decorate("accessJwt", { verify: async () => ({}) }) // Mock JWT
  .decorate("refreshJwt", { verify: async () => ({}) })
  .derive(() => ({
     userId: "mock-uid",
     tenantId: "mock-tid",
     role: "admin"
  }))
  .use(targetRoutes);
```

### Strategi 2: Sinkronisasi Data Test dengan Schema
Memastikan payload test 100% akurat terhadap `schema.ts`:
- Gunakan format UUID valid untuk `params.id`.
- Pastikan tipe data (string vs number) sesuai dengan TypeBox.
- Tambahkan query parameter yang wajib ada (misal: `?date=...` atau `?month=...`).

### Strategi 3: Bypass Middleware Bermasalah
Untuk lingkungan test, kita bisa menonaktifkan `elysia-rate-limit` atau mem-mock fungsi address detection-nya agar tidak menimbulkan overhead error.

### Strategi 4: Perbaikan Mocking Cookie
Mensimulasikan objek Cookie Elysia secara manual di dalam test payload agar method `.set()` dan `.remove()` tidak menyebabkan crash.

---

## 3. Langkah Selanjutnya
Saya merekomendasikan untuk melakukan refactor pada seluruh file `route.test.ts` secara bertahap, dimulai dari modul `Users` dan `Auth` untuk memastikan fondasi authentication mock sudah benar.
