# Kios Sheza API — Project Guide for AI Assistants

## Project Overview

Backend API untuk **Kios Sheza**, sistem Point of Sale (POS) dan manajemen inventori **multi-tenant**. Menyediakan endpoint RESTful untuk autentikasi, produk, kategori, transaksi (retail & Brilink), dan laporan.

**Tech Stack:**
- **Runtime:** Bun
- **Framework:** ElysiaJS (TypeScript)
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Validation:** TypeBox (`elysia`, `drizzle-typebox`)
- **Docs:** Swagger/OpenAPI (`@elysiajs/swagger`)

---

## Commands

```bash
# Dependencies
bun install

# Development (watch mode)
bun run dev

# Production
bun run start

# Database
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:fresh      # Reset & migrate
bun run db:seed       # Seed database
bun run db:studio     # Open Drizzle Studio

# Testing
bun test
```

---

## Project Structure

```
src/
├── index.ts              # Entry point (app setup, global middleware, error handlers)
├── db/
│   ├── index.ts          # Drizzle DB instance
│   ├── seed.ts           # Database seeder
│   ├── reset.ts          # Database reset script
│   └── schema/           # Drizzle table schemas
│       ├── users.ts
│       ├── tenants.ts
│       ├── products.ts
│       ├── categories.ts
│       ├── transactions.ts
│       ├── transactionItems.ts
│       ├── brilinkTransactions.ts
│       └── dailySummaries.ts
├── modules/              # Feature modules (grouped by domain)
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── transactions/
│   ├── brilink/
│   ├── reports/
│   └── index.routes.ts   # Re-exports all module routes
├── plugins/              # Elysia plugins
│   ├── auth.ts           # authPlugin, adminGuard, JWT setup
│   ├── cors.ts
│   ├── swagger.ts
│   ├── logger.ts
│   ├── error.ts          # Shared error classes (AuthError, ForbiddenError, etc.)
│   └── index.ts
├── shared/               # Shared utilities & schemas
│   ├── schema.ts         # withSuccess, withSuccessMeta, shared TypeBox schemas
│   └── index.ts
├── helper/               # Utility helpers
│   └── index.ts
└── jobs/                 # Background jobs (e.g., daily summary cron)
    └── index.ts
```

### Path Aliases (tsconfig.json)

| Alias | Maps To |
|---|---|
| `@/*` | `src/*` |
| `@schema/*` | `src/db/schema/*` |
| `@db` | `src/db/index.ts` |
| `@modules/*` | `src/modules/*` |
| `@plugin` | `src/plugins/index.ts` |
| `@shared` | `src/shared/index.ts` |
| `@helper` | `src/helper/index.ts` |
| `@jobs` | `src/jobs/index.ts` |

---

## Module Structure (Mandatory)

Setiap modul di `src/modules/<domain>/` WAJIB memiliki 4 file:

```
src/modules/<domain>/
├── route.ts    # Endpoint definitions, validation binding, Swagger detail
├── service.ts  # Business logic & database queries
├── schema.ts   # TypeBox request/response schemas
└── error.ts    # Custom domain error classes
```

---

## Conventions

### 1. Response Format

Semua response sukses WAJIB dibungkus menggunakan helper dari `@shared`:

```ts
import { withSuccess, withSuccessMeta } from "@shared";

// Single data
withSuccess(dataSchema)
// → { success: true, message: string, data: T }

// Paginated data
withSuccessMeta(dataSchema, schemaPagination)
// → { success: true, message: string, data: T[], meta: { page, limit, totalData, totalPages } }
```

### 2. Schema (`schema.ts`)

```ts
// Constants & enums at top in UPPER_SNAKE_CASE
const SLUG_REGEX = /^[a-z0-9-]+$/;

// Generate base schemas from Drizzle table definitions
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

// Group sections clearly
// --- Request Schemas ---
// --- Response Schemas ---
```

### 3. Routing (`route.ts`)

```ts
// Every endpoint MUST have a detail block
.get("/products", handler, {
  response: withSuccess(ProductSchema),
  detail: {
    summary: "Get All Products",
    description: "Mengambil daftar semua produk aktif milik tenant.",
    tags: ["Products"],
  },
})

// Protected routes
.use(authPlugin)   // Requires valid JWT
.use(adminGuard)   // Requires role === "admin"
```

### 4. Service & Tenant Isolation (`service.ts`)

```ts
// WAJIB: filter tenantId di setiap query
const products = await db.query.products.findMany({
  where: eq(products.tenantId, tenantId),
});

// Throw custom errors, bukan generic HTTP
throw new ProductNotFoundError(); // ✅
throw new NotFoundError(404, "Not found"); // ❌
```

### 5. Error Handling (`error.ts`)

```ts
// Definisikan error domain di error.ts modul
export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
  }
}

// Map di route.ts dengan .onError()
.error({ PRODUCT_NOT_FOUND: ProductNotFoundError })
.onError(({ code, error, set }) => {
  if (code === "PRODUCT_NOT_FOUND") {
    set.status = 404;
    return { success: false, message: error.message };
  }
})
```

### 6. Soft Delete

```ts
// Jangan hapus fisik data master yang direferensi transaksi
await db.update(products)
  .set({ isActive: false })
  .where(eq(products.id, id));
```

### 7. Security

```ts
// Password hashing
await Bun.password.hash(password, { algorithm: "bcrypt" });

// Refresh token: HttpOnly cookie
cookie.set("refreshToken", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});
```

---

## Auth System

- **Access Token:** JWT, exp `5m`, dikirim via Bearer header
- **Refresh Token:** JWT, exp `7d`, disimpan di HttpOnly cookie
- **Payload JWT:** `{ sub: userId, tenantId, role }`
- **Roles:** `admin` | `cashier`
- `authPlugin` → inject `{ tenantId, userId, role }` ke context
- `adminGuard` → throw `ForbiddenError` jika `role !== "admin"`

---

## Testing

Gunakan `bun test`. Ikuti konvensi berikut:

### Route Tests (Transport Layer)

```ts
import { describe, test, expect, beforeAll, beforeEach, mock } from "bun:test";

describe("Product Routes", () => {
  let app: Elysia;

  beforeAll(async () => {
    // Mock SEBELUM dynamic import
    mock.module(path.resolve(__dirname, "service.ts"), () => ({
      getProducts: mockGetProducts,
    }));

    // Dynamic import SETELAH mock
    const mod = await import("./route");
    app = mod.productRoutes;
  });

  beforeEach(() => {
    mockGetProducts.mockClear(); // Cleanup antar test
  });
});
```

**Key rules:**
- Gunakan `dynamic import` di `beforeAll` agar mock aktif sebelum modul dimuat
- Gunakan `path.resolve(__dirname, "service.ts")` (absolute path) untuk mencegah mock leakage
- Mock `@/plugins` dengan `.decorate()` untuk bypass auth
- Gunakan objek mock stabil yang di-reuse di seluruh rantai query

### Service Tests (Logic Layer)

```ts
// Wajib test tenant isolation
expect(mockDb.query.products.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.any(Function), // memastikan ada filter tenantId
  })
);
```

---

## Environment Variables

Lihat `.env.example` untuk referensi. Bun otomatis memuat `.env` — tidak perlu `dotenv`.

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PORT=3000
```

---

## Important Notes

- Jangan gunakan `node`, `ts-node`, `npx`, `npm`, atau `yarn`. Gunakan `bun` dan `bunx`.
- Bun otomatis load `.env` — tidak perlu `import "dotenv/config"`.
- `Bun.env.VAR` untuk akses environment variables.
- Drizzle schema di `src/db/schema/` adalah **single source of truth** untuk tabel database.
- Semua perubahan skema database harus melalui migration (`bun run db:generate` → `bun run db:migrate`).
