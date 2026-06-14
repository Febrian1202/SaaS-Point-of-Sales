# Perencanaan Implementasi Data Dinamis Daftar Produk

Dokumen ini berisi instruksi dan langkah-langkah untuk mengimplementasikan *fetching* data dinamis pada halaman daftar produk di Dashboard Admin (`apps/web/src/routes/(admin)/admin/products`). Implementasi ini akan menghubungkan UI yang sudah ada dengan API yang dibangun menggunakan ElysiaJS via *Eden Treaty* SvelteKit client.

## 1. Analisis API & Kebutuhan

Berdasarkan *routes* API produk yang ada di `apps/api/src/modules/products/route.ts`:
- **Endpoint Target:** `GET /products`
- **Query Parameter Tersedia:**
  - `search` (opsional): Pencarian nama
  - `barcode` (opsional): Pencarian spesifik barcode
  - `category_id` (opsional): Filter kategori
  - `stock_lte` (opsional): Filter batas stok atas (contohnya `< 5` untuk "stok menipis")
- **Kembalian Data:** Objek dengan `success`, `message`, dan `data` yang berisi *array* dari *object* produk dengan properti kategori bersarang (`category.name`).

## 2. Struktur Kerja SvelteKit & Eden Treaty

Karena ini adalah *dashboard admin* dan memerlukan perlindungan otentikasi serta agar data tersedia lebih aman (tidak terekspos semua rahasia ke klien secara langsung atau untuk tujuan SEO), pendekatan yang disarankan adalah **Server-Side Fetching** pada `+page.server.ts` dan reaktif memunculkannya di `+page.svelte`.

## 3. Langkah-Langkah Implementasi (Instruksi Prompting)

Jika Anda meminta *AI / Engineer* untuk mengerjakan tugas ini, berikan instruksi berikut:

### Langkah 3.1: Pembaruan di `+page.server.ts`
1. Buka `apps/web/src/routes/(admin)/admin/products/+page.server.ts`.
2. Impor `api` *client* dari `$lib/api/client` (atau `$lib/server/api` jika ada versi server khusus, atau gunakan ekstrak *cookie* untuk melewatkan otorisasi ke *treaty* jika menggunakan `$lib/api/client`). **Penting:** Pastikan akses token dioperkan dengan benar jika menggunakan server-side. *Praktik umum di project ini*: Jika ada `$lib/server/api.ts` yang dikhususkan untuk server-side fetch (biasanya menginject fetch event.locals atau cookie), gunakan itu. Mari asumsikan kita punya cara membaca accessToken dari `cookies` event dan melewatkannya.
3. Ambil nilai filter dari `url.searchParams`:
   - `search` / `q`
   - `category_id`
   - `stock_filter` (akan diterjemahkan menjadi `stock_lte` di pemanggilan API)
4. Lakukan panggilan API menggunakan *Eden Treaty*: `api.products.get({ $query: { search: ..., category_id: ... } })`.
5. Tangani *error* atau kembalikan *array* kosong jika panggilan gagal (misalnya karena `error.status === 401`).
6. *Return* data produk ke dalam *prop* `products`. Tambahkan juga parameter pencarian saat ini untuk memudahkan pengelolaan status di klien (opsional).

### Langkah 3.2: Pembaruan di `+page.svelte` (Svelte 5 Runes)
1. Buka `apps/web/src/routes/(admin)/admin/products/+page.svelte`.
2. Hapus variabel `products` statis (dummy data).
3. Tangkap *prop* `data` menggunakan `$props()` seperti ini: `let { data } = $props();`
4. Buat variabel state reaktif untuk mengikat data: `let productsList = $derived(data.products);`
5. Perbarui bagian `#each` *block* dari `products` menjadi `productsList`.
6. Sesuaikan *binding* properti data dengan nama properti dari API:
   - Ganti `product.category` dengan `product.category?.name` (berdasarkan `schemaResponseGet` dari API).
   - Pastikan properti harga sesuai (misal: `product.price` / `product.retailPrice`, pastikan cek *schema database* API untuk produk. Umumnya `retailPrice` di POS). *Catatan: Jika ada inkonsistensi, fallback ke harga default sementara.*
   - Untuk nilai maksimal stok *progress bar* (`maxStock` dummy), Anda bisa mengambil nilai statis sementara atau ambil *max* stok di halaman itu.
   - Perbaiki pengkondisian stok menipis (`isLowStock`), misalnya `product.stock <= 5`.
7. **Implementasi Filter (Reaktivitas UI & URL):**
   - Bind input "Pencarian Cepat" dan *dropdown* menggunakan `$state()`.
   - Gunakan fungsi `goto` dari `$app/navigation` untuk memperbarui URL parameters secara reaktif saat filter berubah (gunakan *debounce* untuk *input text*).
   - Pastikan SvelteKit memanggil ulang fungsi `load` ketika URL *search parameter* berubah (ini perilaku default SvelteKit).

### Langkah 3.3: Komponen Dropdown Kategori API
1. Agar *filter* kategori berjalan dengan ID nyata, sebaiknya `+page.server.ts` juga mem-*fetch* daftar kategori (`GET /categories`).
2. Masukkan daftar kategori ke kembalian *return* dari `load` *function*.
3. Render *dropdown* "Kategori" secara dinamis berdasarkan data kategori dari *server*.

---

## Templat Instruksi Singkat (Copy-Paste ke Model AI)

> "Tolong ubah halaman daftar produk di `apps/web/src/routes/(admin)/admin/products` menjadi dinamis menggunakan data API melalui Eden Treaty.
> 1. Di `+page.server.ts`, ekstrak `url.searchParams` untuk filter (`search`, `category_id`, `stock_lte`), ambil token dari `cookies`, dan panggil `api.products.get()` dan `api.categories.get()` menggunakan `$lib/api/client` (atau `$lib/server/api`). Kembalikan `products` dan `categories`.
> 2. Di `+page.svelte`, gunakan Svelte 5 `$props()` untuk menerima data. Hapus *dummy data*.
> 3. Sesuaikan properti pada iterasi tabel dengan struktur `schemaResponseGet` (misalnya `product.category.name`, `product.retailPrice`, `product.stock`).
> 4. Buat agar *dropdown* kategori merender ID asli, dan perubahan filter akan memanggil `goto("?param=...")` agar SvelteKit me-*reload* data secara SSR. Gunakan gaya Svelte 5 runes (`$state`, `$effect`)."