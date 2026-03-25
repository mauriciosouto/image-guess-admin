# image-guess-admin

Admin panel to preview collectible card game cards and manage **puzzles** in PostgreSQL (no cards table). Step preview uses **FAB zones**, **combined effects**, and deterministic generation from `seed` (see **[docs/](./docs/README.md)**).

## What it does

1. **Pluggable datasources** — Currently [Flesh and Blood](https://fabtcg.com/) via `@flesh-and-blood/cards`. Each plugin defines filters (e.g. set) and exposes `loadCards()` without persisting cards.
2. **In-memory preview** — “Load cards” fills the grid from the plugin.
3. **Puzzles** — “Open Puzzle” calls **get-or-create** (unique `dataSource` + external card id), opens `/puzzles/[id]` with the original image, a **15**-step grid: each overlay view is **stateless** from `seed` + step (`deterministicStep.ts` → `generateRegions`). Art uses a **seeded shuffle** of 16 cells and a **fixed step script** (blur / invert / rotate / clears). See `docs/ZONES_FAB.md` + `docs/PUZZLE_SYSTEM.md`.

## Requirements

- Node.js 20+ (recommended)
- PostgreSQL and `DATABASE_URL` in `.env`

## Deploy (public + password)

In production, set **`ADMIN_BASIC_AUTH_USER`** and **`ADMIN_BASIC_AUTH_PASSWORD`** (HTTP Basic Auth in `middleware.ts`). Step-by-step guide (Vercel, GitHub Actions, alternatives): **[docs/DEPLOY.md](./docs/DEPLOY.md)**.

## Getting started

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Schema: `@@unique([dataSource, externalCardId])`

If `db push` fails with **P2002** / duplicates, the `Puzzle` table already has two rows with the same `(dataSource, externalCardId)` pair. Remove duplicates or clear puzzles in SQL, then run `db push` again.

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

## Useful paths

| Path | Role |
|------|------|
| `lib/datasources/` | Plugins and FAB |
| `lib/puzzle/` | `deterministicStep`, `generateRegions`, `generateSteps`, FAB zones, effects |
| `docs/` | Maintained documentation (see `docs/MAINTENANCE.md`) |
| `app/api/puzzles/*` | get-or-create, regenerate, delete |
| `app/puzzles/[id]/` | Puzzle detail page |

- **[docs/README.md](./docs/README.md)** — documentation index (puzzle, zones, effects, architecture).
- **[project_content.md](./project_content.md)** — compact context and repo tree.

## Conventions

- Next.js 16: see `AGENTS.md` and docs under `node_modules/next`.
- Prisma client in `app/generated/prisma` (gitignored).

## License

Private — see `package.json`.
