# image-guess-admin

Admin panel to preview collectible card game cards and manage **puzzles** in PostgreSQL (no cards table). Step preview uses **FAB zones**, **combined effects**, and deterministic generation from `seed` (see **[docs/](./docs/README.md)**).

## What it does

1. **Pluggable datasources** — Currently [Flesh and Blood](https://fabtcg.com/) via `@flesh-and-blood/cards`. Each plugin defines filters (e.g. set) and exposes `loadCards()` without persisting cards.
2. **In-memory preview** — “Load cards” fills the grid from the plugin.
3. **Puzzles** — “Open Puzzle” calls **get-or-create** (unique `dataSource` + external card id), opens `/puzzles/[id]` with the original image, a **15**-step grid: each overlay view is **stateless** from `seed` + step (`deterministicStep.ts` → `generateRegions`). Art uses a **seeded shuffle** of 16 cells and a **fixed step script** (blur / invert / rotate / clears). See `docs/ZONES_FAB.md` + `docs/PUZZLE_SYSTEM.md`.

## Requirements

- Node.js 20+ (recommended)
- PostgreSQL and `DATABASE_URL` in `.env`

## Database (shared with game)

The **game** project **owns** PostgreSQL migrations and `migrate deploy` for this database. This admin **mirrors** `prisma/schema.prisma` (and usually `prisma/migrations/` copied from game) for `prisma generate` only.

| Command | When |
|---------|------|
| `npm run db:migrate` | **Optional / local disposable DB** — only if you have copied the game’s `prisma/migrations/` and understand you are not the migration owner for shared envs. |
| `npm run db:migrate:deploy` | **Usually not** for shared staging/production — run from the **game** pipeline instead. |
| `npm run db:migrate:status` | Inspect local DB vs migration files (debugging). |

**New developer / empty database:** Apply migrations from the **game** repo against the same `DATABASE_URL`, then here:

```bash
npm install   # prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin needs a schema change?

Use **[docs/PROMPT_GAME_REPO_FULL.md](./docs/PROMPT_GAME_REPO_FULL.md)** in the **game** repo for the full policy + `fabSet` onboarding, or **[docs/PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./docs/PROMPT_GAME_MIGRATION_FROM_ADMIN.md)** for a shorter one-off DDL request. After the game merges, sync `prisma/migrations/` + `schema.prisma` in admin per **[docs/SHARED_DATABASE.md](./docs/SHARED_DATABASE.md)**.

### Legacy `db push` / baselining

If you still have a one-off local DB out of sync with `_prisma_migrations`, fix it with the **game** repo’s migration workflow or follow **SHARED_DATABASE.md** — do not invent a parallel history in admin.

## Deploy (public + password)

In production, set **`ADMIN_BASIC_AUTH_USER`** and **`ADMIN_BASIC_AUTH_PASSWORD`** (HTTP Basic Auth in `middleware.ts`). Step-by-step guide (Vercel, GitHub Actions, migrations): **[docs/DEPLOY.md](./docs/DEPLOY.md)**.

### Schema: `@@unique([dataSource, externalCardId])`

If migrations or seed data violate **P2002** (duplicate `(dataSource, externalCardId)`), remove duplicates in SQL, then ensure schema is applied via the **game** project’s migrations (or your local copy of them).

### TLS (Supabase / poolers / Vercel)

If you see **self-signed certificate in certificate chain**: in **production** set **`DATABASE_RELAX_TLS=true`** (or `DATABASE_SSL_REJECT_UNAUTHORIZED=false`). See `lib/prisma.ts` and **[docs/DEPLOY.md](./docs/DEPLOY.md)**.

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/puzzles/get-or-create` | Get or create puzzle for a card |
| POST | `/api/puzzles/bulk-generate` | Batches of 30: save drafts (`savedAt`), create missing puzzles (saved) |
| POST | `/api/puzzles/regenerate` | New `seed` and steps |
| POST | `/api/puzzles/delete` | Delete puzzle |
| POST | `/api/puzzles/save` | Mark puzzle saved (`savedAt`) |
| POST | `/api/puzzles/lookup` | Status for cards (`dataSource` + external ids) |

## npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest + coverage (thresholds ≥ **60%** lines/statements on `lib/` + `app/api/`) |
| `npm run db:migrate` | Local: `prisma migrate dev` |
| `npm run db:migrate:deploy` | Prod/CI: `prisma migrate deploy` |
| `npm run db:migrate:status` | `prisma migrate status` |

## Useful paths

| Path | Role |
|------|------|
| `lib/datasources/` | Plugins and FAB |
| `lib/puzzle/` | `deterministicStep`, `generateRegions`, `generateSteps`, FAB zones, effects |
| `docs/` | Maintained documentation (see `docs/MAINTENANCE.md`) |
| `prisma/migrations/` | **Mirror** of game repo (same files); admin does not author new migrations for shared DB |
| `app/api/puzzles/*` | get-or-create, regenerate, delete |
| `app/puzzles/[id]/` | Puzzle detail page |

- **[docs/README.md](./docs/README.md)** — documentation index (puzzle, zones, effects, architecture).
- **[docs/GAME_CLIENT_SPEC.md](./docs/GAME_CLIENT_SPEC.md)** — contract for a separate game client (`seed` + step rendering parity).
- **[project_content.md](./project_content.md)** — compact context and repo tree.

## Conventions

- Next.js 16: see `AGENTS.md` and docs under `node_modules/next`.
- Prisma client in `app/generated/prisma` (gitignored).

## License

Private — see `package.json`.
