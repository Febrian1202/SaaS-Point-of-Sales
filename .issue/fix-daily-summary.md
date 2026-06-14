# Instruksi Perbaikan Bug Daily Summary Cache

## Masalah
Fungsi `getDailySummary` di `apps/api/src/modules/reports/service.ts` saat ini melakukan operasi `db.insert(dailySummaries)` (caching) setiap kali endpoint dipanggil, terlepas dari apakah tanggal yang diminta adalah hari ini atau hari yang sudah berlalu.

Hal ini menyebabkan:
1. Saat admin melihat dashboard untuk "hari ini", data ter-insert ke database dengan nilai parsial (karena transaksi belum selesai hingga malam hari).
2. Ketika ada transaksi baru di hari yang sama, dashboard akan menampilkan data "cache" yang lama.
3. Cron job yang berjalan pada tengah malam tidak akan memperbarui data tersebut, karena cron job mendapati "cache" sudah tersedia.

## Solusi (Opsi 1: Pengecekan Tanggal)
Kita akan memodifikasi logika di `getDailySummary` agar **hanya melakukan insert (caching) jika tanggal laporan yang diminta adalah hari-hari sebelumnya**. Untuk "hari ini", fungsi hanya akan menghitung secara *real-time* dan langsung mengembalikan hasil perhitungan tanpa menyimpan ke database.

## Langkah-langkah Implementasi

### 1. Buka File Service
Buka file `apps/api/src/modules/reports/service.ts`.

### 2. Modifikasi `getDailySummary`
Cari fungsi `getDailySummary` dan ubah alur logika pada bagian akhir fungsi (bagian penyimpan ke database).

**Sebelumnya:**
```typescript
  // Kalkulasi total
  // ...
  const retailCogs = 0;
  const grossProfit = totalRevenue - retailCogs;

  // Simpan ke cache dan return
  try {
    const [newSummary] = await db
      .insert(dailySummaries)
// ...
```

**Ubah Menjadi:**
Tambahkan logika untuk mengecek apakah `date` yang di-request adalah hari ini (atau masa depan). Jika ya, jangan di-cache.

```typescript
  // ... (kode kalkulasi sebelumnya tetap sama)
  const retailCogs = 0;
  const grossProfit = totalRevenue - retailCogs;

  const resultData = {
    tenantId,
    summaryDate: date,
    retailRevenue: retailRevenue.toString(),
    retailCogs: retailCogs.toString(),
    brilinkCommission: brilinkCommission.toString(),
    totalRevenue: totalRevenue.toString(),
    grossProfit: grossProfit.toString(),
    trxCount,
    itemsSold,
  };

  // Pengecekan tanggal: Apakah 'date' adalah hari ini atau masa depan?
  // Gunakan zona waktu server atau Asia/Makassar menyesuaikan konfigurasi cron
  const today = new Date();
  
  // Opsi menyesuaikan timezone jika perlu (opsional namun direkomendasikan):
  // const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" }); // Format YYYY-MM-DD
  const todayStr = today.toISOString().split("T")[0]; // Atau UTC standar

  if (date >= todayStr) {
    // Jika hari ini (atau masa depan), kembalikan data real-time tanpa menyimpan ke database
    return resultData;
  }

  // Jika tanggal kemarin atau sebelumnya, simpan ke cache dan return
  try {
    const [newSummary] = await db
      .insert(dailySummaries)
      .values(resultData)
      .returning();

    return newSummary;
  } catch (e: any) {
    if (e.code === "23505") { // Tangani duplicate key
      const retrySummary = await db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.tenantId, tenantId),
          eq(dailySummaries.summaryDate, date),
        ),
      });

      return retrySummary;
    }

    throw new ConflictError("Failed to generate daily summary");
  }
};
```

### 3. Jalankan Pengujian (Testing)
Pastikan tenant isolation dan logika berjalan dengan benar:
1. Hit API report daily untuk "hari ini", pastikan datanya valid dan periksa di Drizzle Studio (`bun run db:studio`) bahwa tabel `daily_summaries` tidak bertambah.
2. Lakukan transaksi baru, hit API lagi, pastikan angka bertambah (real-time).
3. Hit API report daily untuk "kemarin" (atau H-2), periksa apakah data ter-insert ke database.

### 4. Selesai
Perubahan ini memastikan sistem cron job tetap berfungsi maksimal sebagai pencatat data historis secara permanen pada tengah malam, sedangkan dashboard frontend akan selalu menampilkan data *fresh* saat merender metrik untuk hari berjalan.
