# Implementasi Halaman Cashier — `(shared)/`

Panduan implementasi lengkap untuk membuat semua halaman dan komponen yang dibutuhkan role **cashier** di grup route `(shared)/`. Semua pekerjaan dilakukan di `apps/web/`.

---

## Konteks & Referensi Penting

- **Design system**: `apps/web/design.md` — Graphite dark theme. Primary `#ECEDEE`, Tertiary/CTA `#B4FF39`, Neutral `#0E1013`, Surface `#17191C`. Font: Inter Tight (heading), Inter (body), JetBrains Mono (label/mono). Satu aksen tertiary per layar.
- **Komponen UI**: shadcn-svelte (vega). Install via `bunx shadcn-svelte@latest add <component>`. Ikon dari Lucide (`lucide-svelte`).
- **Svelte 5 runes**: Wajib gunakan `$state`, `$derived`, `$derived.by`, `$props`, `$effect`. Dilarang legacy syntax.
- **API client (server)**: `import { serverApi } from '$lib/server/api'` — Eden treaty typed. Selalu baca token dari `cookies.get('accessToken')` dan kirim sebagai header `Authorization: Bearer ${token}`.
- **API client (browser)**: `import { api } from '$lib/api/client'` — auto-inject token dari cookie.
- **URL sync**: Gunakan `useSearchParams` dari `$lib/hooks/useSearchParams.svelte.ts` — jangan buat `$effect` manual untuk URL params.
- **UI Types**: Definisikan tipe baru di `$lib/types/ui.ts`. Konstanta baru di `$lib/constants/index.ts`.
- **Utilitas angka**: `formatRupiah` dari `$lib/utils/index`.
- **Streaming data**: Kembalikan data berat sebagai `streamed: { key: Promise }` dari `+page.server.ts`, konsumsi dengan `{#await data.streamed.key}` + `<Skeleton>` di page.
- **TanStack Table**: Gunakan `createSvelteTable`, `FlexRender`, `renderSnippet` dari `@tanstack/svelte-table` untuk semua tabel data (lihat pola di `(admin)/admin/transactions/+page.svelte`).
- **Linter**: Jalankan `bun run lint && bun run check` setiap selesai mengubah file.
- **Package manager**: Hanya `bun`, jangan npm/yarn/npx.
- **Scrollbar**: Selalu gunakan scrollbar kustom Graphite (track transparan, thumb warna `var(--border)`, hover ke `var(--secondary-foreground)`).

---

## Struktur Route Target

```
apps/web/src/routes/(shared)/
├── +layout.server.ts         ← sudah ada, jangan diubah
├── +layout.svelte            ← UPDATE: tambah CashierSidebar + TopBar
├── dashboard/
│   ├── +page.svelte          ← UPDATE: wire ke API nyata
│   └── +page.server.ts       ← BARU
├── pos/
│   ├── +page.svelte          ← BARU: halaman kasir/checkout utama
│   └── +page.server.ts       ← BARU
├── transactions/
│   ├── +page.svelte          ← BARU: riwayat transaksi cashier
│   ├── +page.server.ts       ← BARU
│   └── [id]/
│       ├── +page.svelte      ← BARU: detail transaksi + struk
│       └── +page.server.ts   ← BARU
├── brilink/
│   ├── +page.svelte          ← BARU: BRI Link — form + riwayat + summary
│   ├── +page.server.ts       ← BARU
│   └── [id]/
│       ├── +page.svelte      ← BARU: detail transaksi BRI Link
│       └── +page.server.ts   ← BARU
└── profile/
    ├── +page.svelte          ← BARU: profil & ganti password
    └── +page.server.ts       ← BARU
```

---

## Komponen Baru yang Harus Dibuat

```
apps/web/src/lib/components/layout/cashier/
├── SideBar.svelte            ← BARU: sidebar navigasi cashier
└── TopBar.svelte             ← BARU: topbar cashier (atau reuse admin TopBar)
```

---

## Task List Implementasi

### [ ] TASK 1: Perbarui konstanta dan tipe

**File**: `$lib/constants/index.ts`

Tambahkan konstanta routes cashier:

```ts
export const CASHIER_ROUTES = {
  DASHBOARD: '/dashboard',
  POS: '/pos',
  TRANSACTIONS: '/transactions',
  BRILINK: '/brilink',
  PROFILE: '/profile',
} as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'qris', label: 'QRIS' },
] as const;

// Brilink trx types (sesuai API schema — nilai enum)
export const BRILINK_TRX_TYPES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'tarik_tunai', label: 'Tarik Tunai' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'other', label: 'Lainnya' },
] as const;
```

**File**: `$lib/types/ui.ts`

Tambahkan tipe yang belum ada:

```ts
// Tipe item di keranjang POS (cart)
export type CartItem = {
  productId: string;
  name: string;
  barcode: string | null;
  unit: string | null;
  unitPrice: number;
  qty: number;
  subtotal: number;
};

// Tipe payment method
export type PaymentMethod = 'cash' | 'transfer' | 'qris';

// Tipe BRI Link trx type (sesuai API enum)
export type BrilinkTrxType = 'transfer' | 'tarik_tunai' | 'pembayaran' | 'e-wallet' | 'other';
```

---

### [ ] TASK 2: Buat CashierSidebar

**File**: `$lib/components/layout/cashier/SideBar.svelte`

Sidebar navigasi khusus cashier. Pola identik dengan `$lib/components/layout/admin/SideBar.svelte`.

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { LayoutDashboard, ShoppingCart, Receipt, Landmark, User } from 'lucide-svelte';
  import * as Avatar from '$lib/components/ui/avatar';
  import { base } from '$app/paths';

  let { user } = $props();

  const isActive = (path: string) => {
    const currentPath = page.url.pathname;
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const menuItems = [
    { name: 'Dasbor', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kasir (POS)', path: '/pos', icon: ShoppingCart },
    { name: 'Riwayat Transaksi', path: '/transactions', icon: Receipt },
    { name: 'BRI Link', path: '/brilink', icon: Landmark },
    { name: 'Profil Saya', path: '/profile', icon: User },
  ];
</script>

<!-- Struktur identik dengan admin SideBar, tapi menuItems khusus cashier -->
<!-- Brand: tampilkan "Transa" + "Kasir" di subtitle -->
<!-- User profile box di bottom: tampilkan nama + role dari prop `user` -->
```

**Styling**: Ikut persis pola admin SideBar — `fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6`. Active state: `bg-primary/5 font-semibold text-primary`. Inactive: `text-muted-foreground hover:bg-border/50`.

---

### [ ] TASK 3: Buat CashierTopBar

**File**: `$lib/components/layout/cashier/TopBar.svelte`

Topbar minimal. Bisa reuse admin TopBar atau buat baru yang hanya menampilkan:
- Judul halaman (dari `page.data.title` atau prop)
- Link logout di kanan

Cek apakah admin TopBar sudah cukup general untuk di-reuse — jika ya, reuse saja.

---

### [ ] TASK 4: Update Layout `(shared)/`

**File**: `(shared)/+layout.svelte`

```svelte
<script lang="ts">
  import SideBar from '$lib/components/layout/cashier/SideBar.svelte';
  import TopBar from '$lib/components/layout/cashier/TopBar.svelte';

  let { data, children } = $props();
  let user = $derived(data.user);
</script>

<div class="min-h-screen bg-background font-sans text-foreground antialiased">
  <SideBar {user} />
  <div class="ml-64 flex min-h-screen flex-col">
    <TopBar {user} />
    <main class="flex-1 px-8 pt-24 pb-8">
      {@render children()}
    </main>
  </div>
</div>
```

**Catatan**: `data.user` sudah disediakan oleh `+layout.server.ts` yang ada (tidak perlu diubah).

---

### [ ] TASK 5: Dashboard Cashier

**File**: `(shared)/dashboard/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const headers = { Authorization: `Bearer ${token}` };
  const today = new Date().toISOString().substring(0, 10);

  // Ambil 5 transaksi terbaru + total hari ini
  const transactionsPromise = serverApi.transactions.get({
    $query: { page: 1, limit: 5, date: today },
    $headers: headers,
  });

  return {
    title: 'Dasbor | Transa',
    streamed: {
      transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null)),
    },
  };
};
```

**File**: `(shared)/dashboard/+page.svelte` ← UPDATE (ganti mock data ke API)

Tampilkan:
1. **Stats cards** (3 kartu): Total Transaksi Hari Ini, Total Pendapatan Hari Ini, Rata-rata Nilai Transaksi — dihitung dari `data.streamed.transactions`
2. **Tabel riwayat transaksi** terbaru (5 baris) dengan skeleton loading
3. **Tombol CTA** "Mulai Transaksi Baru" → navigate ke `/pos` (warna tertiary `#B4FF39`)

Hitung stats secara `$derived.by` dari data yang di-await.

---

### [ ] TASK 6: Halaman POS (Point of Sale)

**File**: `(shared)/pos/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const headers = { Authorization: `Bearer ${token}` };

  const [productsRes, categoriesRes] = await Promise.all([
    serverApi.products.get({ $query: { limit: 50, status: 'AVAILABLE' }, $headers: headers }),
    serverApi.category.get({ $headers: headers }),
  ]);

  return {
    title: 'Kasir | Transa',
    products: productsRes.data?.success ? productsRes.data.data : [],
    categories: categoriesRes.data?.success ? categoriesRes.data.data : [],
  };
};

export const actions: Actions = {
  checkout: async ({ request, cookies }) => {
    const token = cookies.get('accessToken');
    if (!token) throw redirect(303, '/login');

    const formData = await request.formData();
    const body = JSON.parse(formData.get('body') as string);

    const response = await serverApi.transactions.post(body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data?.success) {
      return fail(400, { message: response.data?.message || 'Transaksi gagal' });
    }

    return { success: true, data: response.data.data };
  },
};
```

**File**: `(shared)/pos/+page.svelte` ← BUAT BARU

Layout dua kolom:
- **Kiri** (60%): Daftar produk — search bar (detect barcode vs nama), filter kategori, grid kartu produk. Setiap kartu: nama, harga, stok, klik → tambah ke keranjang.
- **Kanan** (40%): Keranjang (`CartItem[]` via `$state`):
  - Daftar item + qty (tombol +/-) + subtotal per baris
  - Total keseluruhan
  - Input `amountPaid` (jumlah bayar)
  - Tampil kembalian otomatis (`$derived`: `amountPaid - total`)
  - Dropdown payment method (cash/transfer/qris)
  - Tombol "Bayar" → kirim `POST ?/checkout` → tampil receipt modal

**Search logic**: Jika input cocok format barcode (semua alfanumerik tanpa spasi, panjang >= 6), query `?barcode=`. Jika tidak, query `?search=`. Karena produk sudah di-load di server, filter client-side dulu, baru fetch ulang jika diperlukan.

**Receipt modal**: Muncul setelah checkout sukses. Tampil: nomor transaksi, daftar item, total, metode bayar, kembalian. Tombol "Transaksi Baru" (reset cart) + "Lihat Detail".

**State management** (semua `$state`):
```ts
let cart: CartItem[] = $state([]);
let amountPaid = $state(0);
let paymentMethod: PaymentMethod = $state('cash');
let searchQuery = $state('');
let selectedCategory = $state('');
let receiptData = $state<{ trxNumber: string; totalAmount: number; changeAmount: number } | null>(null);
```

**Produk grid**: Gunakan `$derived` untuk filter produk. Kartu produk: `OUT_OF_STOCK` tampil disabled + opacity rendah. `LOW_STOCK` tampil badge kuning.

---

### [ ] TASK 7: Riwayat Transaksi Cashier

**File**: `(shared)/transactions/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const headers = { Authorization: `Bearer ${token}` };
  const page = Number(url.searchParams.get('page') ?? 1);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  // Catatan: API tidak filter by cashierId — filter harus di frontend
  // Kirim date filter untuk membatasi scope
  const transactionsPromise = serverApi.transactions.get({
    $query: { page, limit: 10, from, to },
    $headers: headers,
  });

  return {
    title: 'Riwayat Transaksi | Transa',
    streamed: {
      transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null)),
    },
  };
};
```

**File**: `(shared)/transactions/+page.svelte` ← BUAT BARU

- Filter: date range picker (from/to) menggunakan `useSearchParams`
- TanStack Table dengan kolom: No. Transaksi, Waktu, Total, Metode Bayar, Status, Aksi
- Aksi per baris: tombol "Lihat Detail" → navigate ke `/transactions/[id]`
- Skeleton loading saat await
- Pagination

**Catatan penting**: API mengembalikan semua transaksi tenant. Untuk filter "hanya milik cashier sendiri", bandingkan `cashier.name` dengan `data.user.name` di client (karena API tidak expose `cashierId` di response list). Atau tampilkan kolom "Kasir" dan biarkan cashier melihat semuanya — tergantung keputusan bisnis yang sudah dipilih.

> Berdasarkan jawaban user sebelumnya: filter hanya transaksi sendiri. Implementasi: filter client-side dari response berdasarkan `cashier.name === data.user.name` (atau simpan di `$derived`).

---

### [ ] TASK 8: Detail Transaksi + Struk

**File**: `(shared)/transactions/[id]/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const response = await serverApi.transactions[params.id].get({
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.data?.success) throw error(404, 'Transaksi tidak ditemukan');

  return {
    title: 'Detail Transaksi | Transa',
    transaction: response.data.data,
  };
};
```

**File**: `(shared)/transactions/[id]/+page.svelte` ← BUAT BARU

Tampilan struk digital:
- Header: nama toko (dari user.tenantName jika tersedia, atau hardcode "Transa")
- No. Transaksi, Tanggal/Waktu, Kasir
- Tabel item: Nama Produk | Qty | Harga Satuan | Subtotal
- Garis pemisah
- Total, Dibayar, Kembalian, Metode Bayar
- Tombol "Cetak Struk" (gunakan `window.print()` + CSS `@media print`)
- Tombol kembali ke `/transactions`

---

### [ ] TASK 9: BRI Link — List + Form

**File**: `(shared)/brilink/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const headers = { Authorization: `Bearer ${token}` };
  const today = new Date().toISOString().substring(0, 10);
  const date = url.searchParams.get('date') ?? today;
  const type = url.searchParams.get('type') ?? '';
  const page = Number(url.searchParams.get('page') ?? 1);

  const [summaryPromise, transactionsPromise] = [
    serverApi.brilink.summary.get({ $query: { date }, $headers: headers }),
    serverApi.brilink.get({
      $query: { date, ...(type ? { type } : {}), page, limit: 10 },
      $headers: headers,
    }),
  ];

  return {
    title: 'BRI Link | Transa',
    dateFilter: date,
    typeFilter: type,
    streamed: {
      summary: summaryPromise.then((res) => (res.data?.success ? res.data.data : null)),
      transactions: transactionsPromise.then((res) => (res.data?.success ? res.data : null)),
    },
  };
};

export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const token = cookies.get('accessToken');
    if (!token) throw redirect(303, '/login');

    const formData = await request.formData();
    const body = JSON.parse(formData.get('body') as string);

    const response = await serverApi.brilink.post(body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data?.success) {
      return fail(400, { message: response.data?.message || 'Gagal mencatat transaksi' });
    }

    return { success: true };
  },
};
```

**File**: `(shared)/brilink/+page.svelte` ← BUAT BARU

Layout:
1. **Summary cards** (3 kartu): Total Komisi, Total Volume, Jumlah Transaksi — dari `data.streamed.summary`. Skeleton loading.
2. **Filter bar**: date picker (single date), filter tipe transaksi — gunakan `useSearchParams`
3. **Tombol "Catat Transaksi Baru"** → buka Dialog/Sheet
4. **Tabel riwayat** (TanStack Table): Waktu, No. Referensi, Jenis (badge), Nominal, Admin, Komisi, Status, Aksi
5. Aksi per baris: "Lihat Detail" → `/brilink/[id]`

**Form Transaksi Baru** (Dialog/Sheet):
- Tipe transaksi (select dari `BRILINK_TRX_TYPES`)
- Nominal Pelanggan (`customerAmount`)
- Biaya Admin (`adminFeeCharged`)
- Komisi Agen (`agentCommission`)
- No. Referensi (`referenceNumber` — alfanumerik)
- Catatan opsional (`notes`)
- Submit → `POST ?/create`

**API body schema** (dari `brilink/schema.ts`):
```ts
{
  trxType: 'transfer' | 'tarik_tunai' | 'pembayaran' | 'e-wallet' | 'other',
  customerAmount: number,
  adminFeeCharged: number,
  agentCommission: number,
  referenceNumber: string, // alfanumerik saja
  notes?: string,
}
```

---

### [ ] TASK 10: Detail BRI Link

**File**: `(shared)/brilink/[id]/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const response = await serverApi.brilink[params.id].get({
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.data?.success) throw error(404, 'Transaksi tidak ditemukan');

  return {
    title: 'Detail BRI Link | Transa',
    transaction: response.data.data,
  };
};
```

**File**: `(shared)/brilink/[id]/+page.svelte` ← BUAT BARU

Tampilkan semua field detail:
- Tipe transaksi (badge)
- No. Referensi
- Nominal Pelanggan, Biaya Admin, Komisi Agen
- Status (badge)
- Kasir, Tanggal/Waktu
- Catatan (jika ada)
- Tombol kembali ke `/brilink`

---

### [ ] TASK 11: Profil Cashier

**File**: `(shared)/profile/+page.server.ts` ← BUAT BARU

```ts
import type { PageServerLoad, Actions } from './$types';
import { serverApi } from '$lib/server/api';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');

  const response = await serverApi.users.me.get({
    headers: { Authorization: `Bearer ${token}` },
  });

  return {
    title: 'Profil Saya | Transa',
    profile: response.data?.success ? response.data.data : null,
  };
};

export const actions: Actions = {
  update: async ({ request, cookies }) => {
    const token = cookies.get('accessToken');
    if (!token) throw redirect(303, '/login');

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    const body: Record<string, string> = {};
    if (name) body.name = name;
    if (password) body.password = password;

    const response = await serverApi.users.me.patch(body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data?.success) {
      return fail(400, { message: response.data?.message || 'Gagal memperbarui profil' });
    }

    return { success: true, message: 'Profil berhasil diperbarui' };
  },
};
```

**File**: `(shared)/profile/+page.svelte` ← BUAT BARU

Layout card tunggal:
- **Info section**: Avatar (inisial nama), Nama, Email, Role (badge), Tanggal bergabung
- **Form edit**: Input nama (pre-fill dari profil), input password baru (opsional, kosong = tidak ganti), konfirmasi password (validasi client-side)
- Submit → `POST ?/update`
- Toast notifikasi sukses/gagal
- Validasi: password minimal 6 karakter, `name` minimal 3 karakter, hanya boleh `^[a-zA-Z0-9 .,'-]+$`

---

## Urutan Implementasi yang Disarankan

1. **TASK 1** — Types & constants (fondasi, tidak ada dependensi)
2. **TASK 2 + TASK 3** — CashierSidebar + CashierTopBar (komponen layout)
3. **TASK 4** — Update `(shared)/+layout.svelte` (wiring layout)
4. **TASK 5** — Dashboard (halaman paling sederhana, verifikasi layout)
5. **TASK 6** — POS/Kasir (fitur paling kompleks dan penting)
6. **TASK 7 + TASK 8** — Riwayat + Detail Transaksi
7. **TASK 9 + TASK 10** — BRI Link + Detail BRI Link
8. **TASK 11** — Profil

---

## Pola Kode Berulang yang Wajib Diikuti

### Server Load (template)
```ts
export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('accessToken');
  if (!token) throw redirect(303, '/login');
  const headers = { Authorization: `Bearer ${token}` };
  // ... fetch data
};
```

### Streaming (template)
```ts
// +page.server.ts
return {
  streamed: {
    data: fetchPromise.then((res) => (res.data?.success ? res.data : null)),
  },
};
```
```svelte
<!-- +page.svelte -->
{#await data.streamed.data}
  <Skeleton class="h-32 w-full" />
{:then result}
  <!-- render result -->
{/await}
```

### Form Action Submit (fetch + deserialize)
```svelte
<script>
  import { deserialize } from '$app/forms';
  import { toast } from 'svelte-sonner'; // atau komponen toast yang dipakai

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const response = await fetch('?/actionName', { method: 'POST', body: formData });
    const result = deserialize(await response.text());
    if (result.type === 'success') {
      toast.success('Berhasil!');
    } else {
      toast.error(result.data?.message ?? 'Gagal');
    }
  }
</script>
```

### TanStack Table (template kolom)
```ts
import { createSvelteTable, getCoreRowModel, type ColumnDef } from '@tanstack/svelte-table';
import { renderSnippet } from '@tanstack/svelte-table';

const columns: ColumnDef<RowType>[] = [
  { accessorKey: 'field', header: 'Label' },
  {
    id: 'actions',
    cell: ({ row }) => renderSnippet(actionsSnippet, row.original),
  },
];
```

---

## Validasi Akhir per Task

Setelah setiap task:
1. `bun run lint` — tidak boleh ada error/warning
2. `bun run check` — tidak boleh ada TypeScript error
3. Test manual di browser: navigasi, loading state, error state (token expired)

---

## Catatan API Penting

### Transactions — Request Body (`POST /transactions`)
```ts
{
  items: Array<{
    productId: string; // UUID
    qty: number;
    unitPrice: number;
  }>;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  amountPaid: number;
}
```

### Transactions — Response List
Setiap item berisi: `id`, `trxNumber`, `totalAmount`, `amountPaid`, `changeAmount`, `paymentMethod`, `status`, `createdAt`, `cashier: { name }`, `items[]`.

### Transactions — Response Detail
Field tambahan di `items[]`: `product: { id, name, createdAt }`, `qty`, `unitPrice`, `subtotal`.

### BRI Link — Request Body (`POST /brilink`)
```ts
{
  trxType: 'transfer' | 'tarik_tunai' | 'pembayaran' | 'e-wallet' | 'other';
  customerAmount: number;
  adminFeeCharged: number;
  agentCommission: number; // harus > 0
  referenceNumber: string; // hanya alfanumerik (^[a-zA-Z0-9]+$)
  notes?: string; // tidak boleh mengandung <, >, {, }
}
```

### BRI Link — Summary Response
```ts
{
  date: string;
  grandTotalCommission: number;
  grandTotalTransaction: number;
  grandTotalVolume: number;
  breakdown: Array<{
    trxType: string;
    totalTransaction: number;
    totalCommission: number;
    totalVolume: number;
  }>;
}
```

### Users Me — Response
```ts
{ id, tenantId, name, email, role, isActive, createdAt, updatedAt }
```

### Users Me Update — Request Body (`PATCH /users/me`)
```ts
{ name?: string; password?: string }
// name: min 3 chars, pattern ^[a-zA-Z0-9 .,'-]+$
// password: min 6 chars
```
