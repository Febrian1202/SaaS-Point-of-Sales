# Kios Sheza SaaS POS API

[![Bun](https://img.shields.io/badge/Bun-v1.0+-black?logo=bun)](https://bun.sh/)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-v1.1+-blue?logo=elysia)](https://elysiajs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15+-blue?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-latest-green?logo=drizzle)](https://orm.drizzle.team/)

API Backend untuk **Kios Sheza**, sebuah sistem Point of Sale (POS) dan manajemen inventaris multi-tenant yang dirancang untuk skala SaaS. Dibangun menggunakan Bun dan ElysiaJS dengan fokus pada _type safety_, arsitektur modular, dan isolasi data antar tenant yang ketat.

## 🚀 Fitur Utama

- **Isolasi Multi-Tenant**: Dirancang khusus untuk SaaS. Semua data difilter secara ketat menggunakan `tenantId` untuk mencegah kebocoran data antar toko/tenant.
- **Role-Based Access Control (RBAC)**: Izin akses yang presisi dengan role `admin` dan `cashier`, dilindungi oleh middleware guard khusus.
- **Autentikasi Aman**: Menggunakan JWT dengan fitur rotasi _access_ & _refresh token_ otomatis melalui cookie `HttpOnly` yang aman.
- **Desain Domain Modular**: Pemisahan tanggung jawab yang bersih dengan route, service, schema, dan penanganan error khusus untuk setiap modul.
- **Pelaporan Otomatis**: Ringkasan keuangan harian dan bulanan (pendapatan, laba kotor, komisi agen) yang di-generate otomatis via Cron Job setiap tengah malam.
- **Mekanisme Soft Delete**: Data master (produk, kategori, user) tidak dihapus permanen jika sudah memiliki riwayat transaksi, guna menjaga integritas data.
- **Inventaris Real-time**: Pemotongan stok otomatis saat penjualan dan pemulihan stok otomatis saat transaksi dibatalkan (void).
- **Integrasi Brilink**: Modul khusus untuk agen BRI Link untuk mencatat dana pelanggan, biaya admin, dan komisi agen secara terpisah.

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox)
- **Logging**: [Pino](https://github.com/pinojs/pino) & Pino-Pretty
- **Scheduling**: [Croner](https://github.com/hexagon/croner)
- **Dokumentasi**: Swagger/OpenAPI via `@elysiajs/swagger`

## 📋 Prasyarat

- **Bun**: v1.1.0 atau lebih tinggi
- **PostgreSQL**: v15 atau lebih tinggi

## 🏁 Memulai

### 1. Clone Repositori

```bash
git clone https://github.com/username-anda/kios-sheza-api.git
cd kios-sheza-api
```

### 2. Instal Dependensi

```bash
bun install
```

### 3. Konfigurasi Environment

Buat file `.env` berdasarkan contoh yang ada:

```bash
cp .env.example .env
```

Isi kredensial database dan secret JWT Anda:

```env
DATABASE_URL=postgres://user:password@localhost:5432/kios_sheza
JWT_ACCESS_SECRET=rahasia_access_token_anda
JWT_REFRESH_SECRET=rahasia_refresh_token_anda
PORT=3000
```

### 4. Setup Database

Generate dan jalankan migrasi, lalu masukkan data awal (seeding):

```bash
# Generate file migrasi
bun run db:generate

# Jalankan migrasi ke database
bun run db:migrate

# Masukkan data awal (opsional)
bun run db:seed
```

### 5. Jalankan Aplikasi

```bash
# Mode pengembangan dengan hot reload
bun run dev

# Mode produksi
bun run start
```

## 📂 Struktur Proyek

Proyek ini menggunakan arsitektur modular di mana setiap domain bersifat mandiri:

```text
src/
├── db/                 # Koneksi database, skema, dan migrasi
│   └── schema/         # Definisi tabel Drizzle
├── jobs/               # Cron job dan tugas latar belakang
├── modules/            # Modul Domain (Clean Architecture)
│   ├── auth/           # Login, registrasi, manajemen token
│   ├── brilink/        # Transaksi agen BRI Link
│   ├── categories/     # Manajemen kategori produk
│   ├── products/       # Manajemen produk dan inventaris
│   ├── reports/        # Logika pelaporan keuangan
│   ├── transactions/   # Transaksi POS ritel
│   └── users/          # Manajemen kasir dan staf
├── plugins/            # Plugin Elysia (Auth, CORS, Logger, Swagger)
└── shared/             # Utility umum, konstanta, dan skema global
```

Setiap modul di dalam `src/modules/` biasanya berisi:

- `route.ts`: Definisi endpoint dan logika validasi.
- `service.ts`: Logika bisnis dan interaksi database.
- `schema.ts`: Skema request dan response (Drizzle/TypeBox).
- `error.ts`: Class error khusus untuk domain tersebut.

## 🧪 Pengujian

Proyek ini menggunakan `bun:test` untuk unit testing dan integration testing.

```bash
# Jalankan semua test
bun test

# Jalankan test untuk modul tertentu
bun test src/modules/auth/route.test.ts
```

## 📖 Dokumentasi API

Setelah server berjalan, Anda dapat mengakses dokumentasi interaktif Swagger UI di:

`http://localhost:3000/swagger` (atau sesuai `PORT` yang Anda konfigurasi)

UI ini menyediakan gambaran detail mengenai semua endpoint, payload permintaan, dan struktur respons.

---

Dibuat dengan ❤️ untuk Kios Sheza.
