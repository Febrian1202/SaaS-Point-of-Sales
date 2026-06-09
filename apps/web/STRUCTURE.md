# 🏗️ SvelteKit Frontend Structure Guide

Panduan ini mendokumentasikan struktur folder modular untuk **Kios Sheza Web** yang diselaraskan dengan backend ElysiaJS.

## 📂 Struktur Folder

```text
web/
├── src/
│   ├── lib/
│   │   ├── api/                 # Komunikasi API (Elysia Client)
│   │   │   ├── client.ts        # Setup Eden Treaty & Instance API
│   │   │   └── types.ts         # Export type dari backend untuk frontend
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn Components (Buttons, Inputs, dll)
│   │   │   ├── layout/          # Global Layout (Navbar, Sidebar, Footer)
│   │   │   └── domain/          # Komponen spesifik Domain/Fitur
│   │   │       ├── auth/        # Login/Register forms
│   │   │       ├── products/    # Product list, Inventory cards
│   │   │       ├── transactions/# POS UI, Receipt, Payment modes
│   │   │       ├── brilink/     # Brilink specific components
│   │   │       └── reports/     # Charts, Tables, Data summary
│   │   ├── hooks/               # Svelte 5 Runes (.svelte.ts)
│   │   │   ├── auth.svelte.ts   # Global auth state & logic
│   │   │   └── cart.svelte.ts   # POS cart logic (reaktif)
│   │   ├── utils.ts             # Helper (Currency format, Date, cn)
│   │   └── assets/              # Gambar, Icons, Favicon
│   ├── routes/
│   │   ├── (auth)/              # Route Group: Tanpa Sidebar (Login/Register)
│   │   │   ├── login/           # /login
│   │   │   └── register/        # /register
│   │   ├── (dashboard)/         # Route Group: Dengan Sidebar (App Utama)
│   │   │   ├── +layout.svelte   # Sidebar/Nav wrapper (Auth Guard di sini)
│   │   │   ├── products/        # /products (Manajemen Stok)
│   │   │   ├── transactions/    # /transactions (Kasir/POS)
│   │   │   ├── brilink/         # /brilink (Transaksi Brilink)
│   │   │   └── reports/         # /reports (Dashboard Penjualan)
│   │   ├── +layout.svelte       # Root Layout (Theme, Toaster, CSS)
│   │   ├── +page.svelte         # Landing/Redirect logic
│   │   └── layout.css           # Global Tailwind/Base styles
│   ├── app.d.ts                 # Type definitions (App.Locals, dll)
│   └── app.html                 # HTML Template
├── static/                      # Static assets (robots.txt, icons)
├── package.json
└── svelte.config.js
```

---

## 🔑 Konvensi & Prinsip Utama

### 1. End-to-End Type Safety (`lib/api`)

Kita memanfaatkan **Eden Treaty** dari Elysia. Jangan mendefinisikan ulang interface yang sudah ada di backend. Gunakan tipe data langsung dari backend untuk konsistensi.

```typescript
// Contoh penggunaan di client.ts
import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../../api/src/index';

export const api = edenTreaty<App>('http://localhost:3000');
```

### 2. Domain-Driven Components (`lib/components/domain`)

Pisahkan komponen berdasarkan fitur (domain), bukan sekadar teknis.

- **`ui/`**: Komponen atomik/generik dari Shadcn (Button, Card, Input).
- **`domain/`**: Komponen yang mengandung logika bisnis atau terikat pada data model tertentu (misal: `ProductTable.svelte`).

### 3. Svelte 5 Runes untuk State Management (`lib/hooks`)

Gunakan file `.svelte.ts` untuk logika reaktif yang dibagikan antar komponen/page.

- Gunakan `$state` untuk data global.
- Gunakan pola _Functional Store_ yang mengembalikan fungsi getter/setter yang reaktif.

### 4. Route Grouping & Protection

- **`(auth)`**: Digunakan untuk halaman publik/login. Layout di sini biasanya _full-page_ tanpa sidebar.
- **`(dashboard)`**: Digunakan untuk halaman internal. Layout di sini menangani **Authentication Guard** dan **Multi-tenancy check**.

### 5. Multi-Tenant Consistency

Pastikan setiap request yang membutuhkan konteks toko menyertakan `tenantId` yang didapat dari session user. Simpan konteks tenant ini di global state (`auth.svelte.ts`) setelah login berhasil.

---

## 🚀 Workflow Pengembangan

1. Jika ada perubahan skema di API, jalankan sinkronisasi tipe (jika diperlukan).
2. Tambahkan komponen baru ke folder `domain/` yang relevan.
3. Gunakan `$lib` alias untuk impor yang bersih (misal: `$lib/api/client`).
4. Pastikan validasi form di frontend selaras dengan skema TypeBox di backend.
