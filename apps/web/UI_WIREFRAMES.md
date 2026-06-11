# UI Wireframes & API Data Flow — Kios Sheza POS

Dokumen ini berisi wireframe berbasis teks dan diagram aliran data (**UI → API**) untuk aplikasi Web (Admin Dashboard) dan Mobile/Tablet (Cashier POS).

---

## Ringkasan Endpoint API

| Method   | Endpoint                 | Guard  | Deskripsi                  |
| -------- | ------------------------ | ------ | -------------------------- |
| `POST`   | `/auth/register`         | —      | Daftar toko baru           |
| `POST`   | `/auth/login`            | —      | Login admin/kasir          |
| `POST`   | `/auth/refresh`          | Cookie | Silent refresh token       |
| `POST`   | `/auth/logout`           | JWT    | Logout                     |
| `GET`    | `/users/me`              | JWT    | Profil user aktif          |
| `PATCH`  | `/users/me`              | JWT    | Update profil sendiri      |
| `GET`    | `/users`                 | Admin  | Daftar kasir               |
| `POST`   | `/users`                 | Admin  | Tambah kasir               |
| `PATCH`  | `/users/:id`             | Admin  | Edit kasir                 |
| `DELETE` | `/users/:id`             | Admin  | Nonaktifkan kasir          |
| `GET`    | `/products`              | JWT    | Daftar produk (+ filter)   |
| `GET`    | `/products/:id`          | JWT    | Detail produk              |
| `POST`   | `/products`              | Admin  | Tambah produk              |
| `PATCH`  | `/products/:id`          | Admin  | Edit produk                |
| `DELETE` | `/products/:id`          | Admin  | Soft-delete produk         |
| `GET`    | `/categories`            | JWT    | Daftar kategori            |
| `POST`   | `/categories`            | Admin  | Tambah kategori            |
| `PATCH`  | `/categories/:id`        | Admin  | Edit kategori              |
| `DELETE` | `/categories/:id`        | Admin  | Hapus kategori             |
| `GET`    | `/transactions`          | JWT    | Riwayat transaksi          |
| `GET`    | `/transactions/:id`      | JWT    | Detail transaksi           |
| `POST`   | `/transactions`          | JWT    | Buat transaksi (checkout)  |
| `POST`   | `/transactions/:id/void` | Admin  | Batalkan transaksi         |
| `GET`    | `/brilink`               | JWT    | Riwayat transaksi Brilink  |
| `GET`    | `/brilink/summary`       | JWT    | Ringkasan komisi Brilink   |
| `GET`    | `/brilink/:id`           | JWT    | Detail transaksi Brilink   |
| `POST`   | `/brilink`               | JWT    | Catat transaksi Brilink    |
| `POST`   | `/brilink/:id/void`      | Admin  | Batalkan transaksi Brilink |
| `GET`    | `/reports/daily`         | Admin  | Laporan harian             |
| `GET`    | `/reports/monthly`       | Admin  | Laporan bulanan            |

---

## 🔐 Alur Autentikasi

### Wireframe: Halaman Login

```
+--------------------------------------------------+
|              🏪 Kios Sheza                        |
|                                                  |
|   Email                                          |
|   [ admin@toko.com                             ] |
|                                                  |
|   Password                                       |
|   [ ••••••••                                   ] |
|                                                  |
|   [        MASUK         ]                       |
|   Belum punya toko? Daftar di sini               |
+--------------------------------------------------+
```

### Flow: Login

```
UI (Form Login)
  │
  │  POST /auth/login
  │  Body: { email, password }
  ▼
API
  │  → Verifikasi email & bcrypt password
  │  → Sign accessToken (JWT, 5m)
  │  → Sign refreshToken (JWT, 7d)
  │  → Simpan refreshToken ke DB
  │  → Set cookie HttpOnly: refreshToken
  ▼
Response 200:
  { accessToken, user: { id, name, email, role, tenantId } }
  │
  ▼
UI
  → Simpan accessToken ke memory/localStorage
  → Simpan user info ke state
  → Redirect ke Dashboard
```

### Flow: Silent Refresh (Token Expired)

```
UI (Interceptor HTTP)
  │  accessToken expired → 401
  │
  │  POST /auth/refresh
  │  (Cookie refreshToken dikirim otomatis)
  ▼
API
  │  → Verifikasi refreshToken dari cookie
  │  → Cek kecocokan token di DB
  │  → Sign accessToken baru
  ▼
Response 200: { accessToken }
  │
  ▼
UI → Retry request awal dengan token baru
```

---

## 🖥️ Web App — Admin Dashboard

### Master Layout

```
+-----------------------------------------------------------------------+
| [Logo Kios Sheza]               | 👤 Nama Admin | [🔔] [🚪 Logout]  |
+----------------+------------------------------------------------------+
| 🏠 Dashboard   |                                                      |
| 📦 Produk      |                                                      |
| 🗂️ Kategori    |   [ Area Konten Utama ]                              |
| 💳 Transaksi   |                                                      |
| 🏦 Brilink     |                                                      |
| 👥 Staf        |                                                      |
| 📈 Laporan     |                                                      |
+----------------+------------------------------------------------------+
```

> **Mount:** `GET /users/me` → tampilkan nama admin di header.

---

### 1. Halaman Dashboard

```
+-----------------------------------------------------------------------+
| 📊 Ringkasan Hari Ini (Senin, 31 Mei 2026)                           |
+-------------------+-------------------+-------------------+-----------+
| 💰 Omzet Retail   | 🏦 Komisi Brilink | 📦 Produk Terjual | 🧾 Trx   |
| Rp 2.450.000      | Rp 125.000        | 87 item           | 34        |
+-------------------+-------------------+-------------------+-----------+
|                                                                       |
| [ Grafik Tren Pendapatan — 7 Hari Terakhir ]                         |
|                                                                       |
+-------------------+---------------------------------------------------+
| Transaksi Terbaru |  Produk Stok Menipis                              |
| TRX-001 Rp 35.000 |  Sabun Mandi — 5 pcs ⚠️                          |
| TRX-002 Rp 12.500 |  Kopi Sachet — 3 pcs ⚠️                          |
+-------------------+---------------------------------------------------+
```

**Flow:**

```
UI Mount
  ├─ GET /reports/daily?date=2026-05-31   → kartu ringkasan
  ├─ GET /transactions?limit=5            → tabel transaksi terbaru
  └─ GET /products?limit=5               → produk stok menipis
```

---

### 2. Halaman Manajemen Produk

```
+-----------------------------------------------------------------------+
| 📦 Daftar Produk                                       [+ Tambah Baru]|
+-----------------------------------------------------------------------+
| Kategori: [Semua v] | Status: [Aktif v] | 🔍 [Cari nama/barcode...  ]|
+-----------------------------------------------------------------------+
| Foto | Barcode  | Nama Produk | Kategori | Harga Jual | Stok | Aksi   |
|------+----------+-------------+----------+------------+------+--------|
| [🖼️] | 89912345 | Kopi Hitam  | Minuman  | Rp 5.000   |  50  | ✏️ 🗑️ |
| [🖼️] | 89954321 | Roti Gandum | Makanan  | Rp 15.000  |  12  | ✏️ 🗑️ |
| [🖼️] | —        | Sabun Mandi | Toiletri | Rp 4.000   |   5  | ✏️ 🗑️⚠️|
+-----------------------------------------------------------------------+
| Menampilkan 1–3 dari 150 produk                        [< ] [1][2][>] |
+-----------------------------------------------------------------------+
```

**Flow — Muat Halaman:**

```
UI Mount
  │
  │  GET /products?search=&category_id=&page=1
  │  Header: Authorization: Bearer <accessToken>
  ▼
Response 200: { data: Product[], meta: { page, limit, totalData, totalPages } }
  │
  ▼
UI → Render tabel produk
```

**Flow — Tambah Produk (Modal Form):**

```
Admin klik [+ Tambah Baru]
  │
  │  GET /categories   → isi dropdown kategori
  ▼
Admin isi form → klik Simpan
  │
  │  POST /products
  │  Body: { name, barcode?, categoryId, price, stock, imageUrl? }
  │  Header: Authorization: Bearer <accessToken>  [adminGuard]
  ▼
Response 201: { data: Product }
  │
  ▼
UI → Tutup modal, refresh tabel
```

**Flow — Edit Produk:**

```
Admin klik ✏️
  │
  │  GET /products/:id   → prefill form
  ▼
Admin ubah data → klik Simpan
  │
  │  PATCH /products/:id
  │  Body: { field yang diubah saja }
  │  [adminGuard]
  ▼
Response 200: { data: Product }  →  UI update baris tabel
```

**Flow — Hapus Produk:**

```
Admin klik 🗑️ → konfirmasi dialog
  │
  │  DELETE /products/:id   [adminGuard]
  ▼
Response 200: { success: true }
  │
  ▼
UI → Hapus baris dari tabel (soft-delete, isActive = false)
```

---

### 3. Halaman Manajemen Staf (Kasir)

```
+-----------------------------------------------------------------------+
| 👥 Daftar Staf                                        [+ Kasir Baru] |
+-----------------------------------------------------------------------+
| Nama          | Email              | Role   | Status   | Aksi         |
|---------------+--------------------+--------+----------+--------------|
| Budi Santoso  | budi@toko.com      | Kasir  | Aktif ✅ | ✏️ 🗑️        |
| Sari Dewi     | sari@toko.com      | Kasir  | Aktif ✅ | ✏️ 🗑️        |
| Rudi (nonaktif)| rudi@toko.com     | Kasir  | Nonaktif ❌| ✏️          |
+-----------------------------------------------------------------------+
```

**Flow:**

```
Mount  →  GET /users             [Admin only]
Tambah →  POST /users            Body: { name, email, password }
Edit   →  PATCH /users/:id       Body: { name?, email?, password? }
Hapus  →  DELETE /users/:id      (soft-delete: isActive = false)
```

---

### 4. Halaman Riwayat Transaksi

```
+-----------------------------------------------------------------------+
| 💳 Riwayat Transaksi                                                  |
+-----------------------------------------------------------------------+
| Tanggal: [31/05/2026] s/d [31/05/2026]  | 🔍 [No. Struk...]  [Filter]|
+-----------------------------------------------------------------------+
| No. Struk | Kasir       | Total      | Item | Tgl & Waktu   | Aksi    |
|-----------+-------------+------------+------+---------------+---------|
| TRX-0034  | Budi        | Rp 35.000  |  3   | 31/05 14:22   | 👁️ 🚫   |
| TRX-0033  | Sari        | Rp 12.500  |  1   | 31/05 13:05   | 👁️ 🚫   |
| TRX-0032  | Budi        | Rp 8.000   |  2   | 31/05 11:30   | 👁️ —    |
+-----------------------------------------------------------------------+
| 👁️ = Lihat Detail   🚫 = Void (Admin Only)                           |
+-----------------------------------------------------------------------+
```

**Flow:**

```
Mount  →  GET /transactions?page=1&date=2026-05-31
Detail →  GET /transactions/:id
Void   →  POST /transactions/:id/void   [Admin only]
           → stok dikembalikan otomatis
```

---

### 5. Halaman Laporan

```
+-----------------------------------------------------------------------+
| 📈 Laporan Performa Toko                                              |
+----------------+------------------------------------------------------+
| [ Harian  v ]  | Tanggal: [31/05/2026]              [Tampilkan]       |
+-----------------------------------------------------------------------+
|  Omzet Retail         |  Rp 2.450.000                                 |
|  Komisi Brilink       |  Rp   125.000                                 |
|  Total Transaksi      |  34 transaksi                                 |
|  Produk Terjual       |  87 item                                      |
+-----------------------------------------------------------------------+
| [ Bulanan v ] | Bulan: [Mei 2026]                   [Tampilkan]       |
+-----------------------------------------------------------------------+
| [ Grafik Bar — Omzet per Hari dalam Bulan ]                          |
+-----------------------------------------------------------------------+
```

**Flow:**

```
Laporan Harian   →  GET /reports/daily?date=2026-05-31    [Admin only]
Laporan Bulanan  →  GET /reports/monthly?month=2026-05    [Admin only]
```

---

## 📱 Mobile/Tablet — Cashier POS

### 1. Layar Utama POS (Landscape)

```
+----------------------------------------------+--------------------------+
| 🔍 Cari / Scan Barcode...                    | 🛒 Keranjang (3 item)    |
+----------------------------------------------+--------------------------+
| [ Semua ] [ Minuman ] [ Snack ] [ Rokok ]    |                          |
+----------------------------------------------| 1× Kopi Hitam            |
|                                              | Rp 5.000             [x] |
| +---------+  +---------+  +---------+        |                          |
| |   ☕    |  |   🍞    |  |   🍫    |        | 2× Roti Gandum           |
| | Kopi    |  | Roti    |  | Coklat  |        | Rp 30.000            [x] |
| | Rp 5k   |  | Rp 15k  |  | Rp 10k  |        |                          |
| +---------+  +---------+  +---------+        |--------------------------|
|                                              | Subtotal:    Rp 35.000   |
| +---------+  +---------+  +---------+        | Diskon:      Rp      0   |
| |   🍬    |  |   🥤    |  |   🍜    |        |--------------------------|
| | Permen  |  | Soda    |  | Mie     |        | Total:       Rp 35.000   |
| | Rp 1k   |  | Rp 6k   |  | Rp 4k   |        |                          |
| +---------+  +---------+  +---------+        | [   💳 BAYAR SEKARANG  ] |
+----------------------------------------------+--------------------------+
| 🏠 POS Retail  |  🏦 Brilink  |  📋 Riwayat  |  👤 Kasir: Budi          |
+-----------------------------------------------------------------------+
```

**Flow — Muat Produk:**

```
UI Mount
  │
  ├─ GET /users/me                → tampilkan nama kasir
  └─ GET /products                → grid produk semua kategori
     GET /categories              → tab filter kategori
     GET /products?category_id=X  → filter per tab
     GET /products?barcode=XXX    → hasil scan barcode
```

**Flow — Checkout:**

```
Kasir klik [BAYAR SEKARANG]
  │
  ▼
Modal Pembayaran muncul (lihat di bawah)
  │
Kasir input uang diterima → klik [SELESAI & CETAK]
  │
  │  POST /transactions
  │  Body: {
  │    items: [{ productId, quantity, price }],
  │    totalPrice,
  │    amountPaid,
  │    change
  │  }
  │  Header: Authorization: Bearer <accessToken>
  ▼
Response 201: { data: { trxNumber, items, totalPrice, change } }
  │
  ▼
UI → Cetak struk, kosongkan keranjang
   → Stok produk berkurang otomatis (server-side)
```

---

### 2. Modal Pembayaran

```
      +-------------------------------------------+
      | 💳 Pembayaran                             |
      +-------------------------------------------+
      | Total Tagihan:              Rp 35.000     |
      |                                           |
      | Uang Diterima:              [ 50000     ] |
      |                                           |
      | Nominal Cepat:                            |
      | [ Uang Pas ] [ Rp 50.000 ] [ Rp 100.000 ]|
      |                                           |
      |-------------------------------------------|
      | Kembalian:                  Rp 15.000     |
      |                                           |
      | [  BATAL  ]        [ SELESAI & CETAK  ]  |
      +-------------------------------------------+
```

---

### 3. Layar Riwayat Transaksi (Kasir)

```
+-----------------------------------------------------------------------+
| 📋 Riwayat Hari Ini                               [Filter Tanggal]   |
+-----------------------------------------------------------------------+
| TRX-0034 | 14:22 | Rp 35.000 | 3 item              [ Lihat Detail ] |
| TRX-0033 | 13:05 | Rp 12.500 | 1 item              [ Lihat Detail ] |
| TRX-0032 | 11:30 | Rp  8.000 | 2 item              [ Lihat Detail ] |
+-----------------------------------------------------------------------+
```

**Flow:**

```
Mount  →  GET /transactions?date=TODAY&limit=20
Detail →  GET /transactions/:id   → tampilkan modal detail struk
```

---

### 4. Layar Transaksi Brilink

```
+-----------------------------------------------------------------------+
| 🏦 Pencatatan Agen BRI Link                                           |
+-----------------------------------------------------------------------+
| Jenis Transaksi:                                                      |
| [ Transfer Antar Bank        v ]                                      |
|                                                                       |
| Nominal Uang Pelanggan (Rp):                                          |
| [ 1.000.000                                      ]                   |
|                                                                       |
| Biaya Admin Dikenakan (Rp):                                           |
| [ 15.000                                         ]                   |
|                                                                       |
|-----------------------------------------------------------------------|
| Ringkasan:                                                            |
| Uang Diterima dari Pelanggan:     Rp 1.015.000                       |
| (Nominal + Biaya Admin)                                               |
|                                                                       |
|                   [ SIMPAN TRANSAKSI BRILINK ]                        |
+-----------------------------------------------------------------------+
| 🏠 POS Retail  |  🏦 Brilink  |  📋 Riwayat  |  👤 Kasir: Budi       |
+-----------------------------------------------------------------------+
```

**Flow — Catat Brilink:**

```
Kasir isi form → klik [SIMPAN TRANSAKSI BRILINK]
  │
  │  POST /brilink
  │  Body: {
  │    type: "transfer",
  │    amount: 1000000,
  │    adminFee: 15000,
  │    agentCommission: (dihitung server)
  │  }
  ▼
Response 201: { data: { referenceNumber, type, amount, agentCommission } }
  │
  ▼
UI → Tampilkan nomor referensi, reset form
```

**Flow — Ringkasan Brilink:**

```
GET /brilink/summary?date=2026-05-31
  → { totalVolume, totalCommission, breakdown: [{ type, count, commission }] }
```

---

## 🔄 Global Auth Flow (Token Lifecycle)

```
┌────────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                            │
│                                                                │
│  Login ──────────────→  accessToken (5 menit, in-memory)      │
│                    └──→  refreshToken (7 hari, HttpOnly Cookie)│
│                                                                │
│  Setiap Request API ─→  Header: Authorization: Bearer <token> │
│                                                                │
│  Token expired (401) ─→  POST /auth/refresh (auto by client)  │
│                    └──→  accessToken baru → retry request      │
│                                                                │
│  Logout ─────────────→  POST /auth/logout                     │
│                    ├──→  refreshToken dihapus dari DB          │
│                    └──→  Cookie dihapus dari browser           │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Matriks Akses per Layar

| Layar / Fitur               | Kasir | Admin |
| --------------------------- | :---: | :---: |
| Login / Register            |  ✅   |  ✅   |
| POS Retail (buat transaksi) |  ✅   |  ✅   |
| Lihat Riwayat Transaksi     |  ✅   |  ✅   |
| Catat & Lihat Brilink       |  ✅   |  ✅   |
| Void Transaksi / Brilink    |  ❌   |  ✅   |
| Manajemen Produk (CRUD)     |  ❌   |  ✅   |
| Manajemen Kategori (CRUD)   |  ❌   |  ✅   |
| Manajemen Staf (CRUD)       |  ❌   |  ✅   |
| Laporan Harian & Bulanan    |  ❌   |  ✅   |
| Update profil sendiri       |  ✅   |  ✅   |
