# AGENTS.md

Multiplatform POS system ("Kios Sheza" / "Transa") — monorepo with 3 apps.
Package manager is **Bun** everywhere (never use npm/yarn/npx/node/ts-node).
Versioning via Changesets; `bun run version` at root also syncs `pubspec.yaml` build number.

## Repository layout

```
apps/
  api/     # ElysiaJS + Bun + Drizzle ORM + PostgreSQL (REST API)
  web/     # SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + shadcn-svelte (vega)
  mobile/  # Flutter/Dart (early stage, only lib/main.dart exists)
```

Root `package.json` defines `workspaces: ["apps/*"]` but each app has its own lockfile (`bun.lock`).
No CI workflows exist yet.

## apps/api

### Commands (run from `apps/api/`)

```bash
bun install
bun run dev          # watch mode
bun run start        # production
bun test             # bun:test
bun run db:generate  # drizzle-kit generate
bun run db:migrate   # drizzle-kit migrate
bun run db:fresh     # reset DB + migrate
bun run db:seed      # seed data
bun run db:studio    # Drizzle Studio GUI
```

Schema changes: edit `src/db/schema/*.ts` then `db:generate` then `db:migrate`. Schemas are the single source of truth.

### Architecture

- Entrypoint: `src/index.ts` — mounts plugins, error handlers, all module routes, starts cron job, exports `type App` (used by web via Eden treaty).
- Modules live in `src/modules/<domain>/` and **must** have exactly 4 files: `route.ts`, `service.ts`, `schema.ts`, `error.ts`.
- Plugins: `src/plugins/` (auth, cors, swagger, logger, error classes).
- Background jobs: `src/jobs/` (daily summary cron via `croner`).

### Path aliases (tsconfig)

`@/*` = `src/*`, `@schema/*` = `src/db/schema/*`, `@db` = `src/db/index.ts`, `@modules/*` = `src/modules/*`, `@plugin` = `src/plugins/index.ts`, `@shared` = `src/shared/index.ts`, `@helper` = `src/helper/index.ts`, `@jobs` = `src/jobs/index.ts`.

### Key conventions

- **Multi-tenant**: every DB query **must** filter by `tenantId`. Test tenant isolation.
- **Response wrapping**: all success responses use `withSuccess()` or `withSuccessMeta()` from `@shared`.
- **Domain errors**: throw custom errors from `error.ts` (not generic HTTP errors). Map them in `route.ts` via `.error()` + `.onError()`.
- **Soft delete**: master data referenced by transactions uses `isActive: false`, never physical delete.
- **Swagger**: every endpoint must have a `detail` block with `summary`, `description`, `tags`.
- **Auth**: JWT access (5 min, Bearer) + refresh (7 days, HttpOnly cookie). Payload: `{ sub, tenantId, role }`. Roles: `admin` | `cashier`. Use `authPlugin` / `adminGuard`.
- **Password hashing**: `Bun.password.hash(pw, { algorithm: "bcrypt" })`.
- **Env**: Bun auto-loads `.env` — no dotenv import needed. Use `Bun.env.VAR`. See `.env.example` for required vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, `WEB_URL`.

### Testing quirks

- Route tests: `mock.module()` **before** dynamic `await import("./route")` in `beforeAll`. Use `path.resolve(__dirname, "service.ts")` for absolute mock paths.
- Mock `@/plugins` with `.decorate()` (not `.derive()`) to bypass auth.
- Service tests: verify `tenantId` filter is present in queries.
- `beforeEach`: call `.mockClear()` on all mocks.

## apps/web

### Commands (run from `apps/web/`)

```bash
bun install
bun run dev          # Vite dev server
bun run build        # production build
bun run check        # svelte-check + typecheck
bun run lint         # prettier --check + eslint
bun run format       # prettier --write
bun test             # bun test
```

### Architecture

- SvelteKit 2 with **Svelte 5 runes mode** enforced (use `$state`, `$derived`, `$props`, `$effect` — no legacy syntax).
- Route groups: `(admin)/`, `(auth)/`, `(shared)/`.
- UI: shadcn-svelte (vega style), Lucide icons, Tailwind CSS 4 with theme in `src/routes/layout.css`.
- API client: Eden treaty typed client at `src/lib/api/client.ts`, imports `type App` from the api app.
- **Cross-app aliases**: `svelte.config.js` maps `@`, `@modules`, `@schema`, `@db`, `@plugin`, `@jobs`, `@shared`, `@helper` to `../api/src/...` — the web app directly imports API types.

### Style conventions

- Prettier: tabs, single quotes, no trailing commas, 100 char width.
- Use `cn()` from `$lib/utils.ts` for conditional Tailwind classes.
- Add shadcn components to `src/lib/components/ui/` via shadcn-svelte CLI.

## apps/mobile

Flutter/Dart app (SDK ^3.11.5). State: `flutter_riverpod`. HTTP: `dio`. Local DB: `drift`. Routing: `go_router`. Secure storage: `flutter_secure_storage`.

Very early stage — only `lib/main.dart` exists. Use `flutter run`, `flutter analyze`, `flutter test`.

`sync-version.js` syncs version from `package.json` to `pubspec.yaml` (bumps build number). Called automatically by root `bun run version`.

## Detailed instruction files

Each app has its own instruction files with full conventions — consult them when working in that app:

- `apps/api/CLAUDE.md` — comprehensive API conventions, module structure, testing patterns
- `apps/api/GEMINI.md` — similar content, slightly different framing
- `apps/web/GEMINI.md` — web conventions, Svelte 5 runes, Tailwind 4, shadcn details
