# image-guess-admin — Project content

Context for onboarding, AI, and the team: structure, stack, and current behavior.

## Purpose

Web admin to **preview** cards from **pluggable datasources** (currently **Flesh and Blood**). Grid cards are **not saved to the database** when you “Load cards”. What **is** persisted are **puzzles**: card metadata + `seed` + **15× `PuzzleStep`** (`blur`/`brightness` for the API; the preview UI **does not** use them to draw). Preview: full image + **deterministic** overlays from `seed` + step (`deterministicStep.ts` / `generateRegions` — 4×4 art shuffle + scripted 15-step reveal). **Docs:** [docs/README.md](./docs/README.md), [docs/ZONES_FAB.md](./docs/ZONES_FAB.md), [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript |
| Styles | Tailwind CSS 4 |
| ORM | Prisma 7 (`prisma-client` → `app/generated/prisma`) |
| Database | PostgreSQL (e.g. Supabase) via `@prisma/adapter-pg` + `pg` |
| FAB data | `@flesh-and-blood/cards` |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (`prisma.config.ts`, `lib/prisma.ts`) |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Optional. In **development** TLS is usually relaxed unless `true`/`1`. See `lib/prisma.ts`. |

## Source tree

```
├── app/
│   ├── api/
│   │   ├── puzzles/
│   │   │   ├── get-or-create/route.ts
│   │   │   ├── bulk-generate/route.ts
│   │   │   ├── regenerate/route.ts
│   │   │   ├── save/route.ts
│   │   │   ├── lookup/route.ts
│   │   │   └── delete/route.ts
│   │   └── datasources/
│   │       ├── route.ts              # GET — sources + filter schema
│   │       └── load/route.ts         # POST — preview JSON (no DB write)
│   ├── generated/prisma/             # Prisma client (gitignored → prisma generate)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                      # Home: filters, grid, open puzzle
│   └── puzzles/[id]/                 # Puzzle detail (server) + client actions
├── docs/                         # See docs/README.md and MAINTENANCE.md
├── lib/
│   ├── puzzle/
│   │   ├── deterministicStep.ts
│   │   ├── generateRegions.ts
│   │   ├── generateSteps.ts
│   │   ├── regionTypes.ts
│   │   ├── effects/              # types, getEffectsForStep
│   │   ├── zones/                # fabZones
│   │   ├── parsePuzzleCardBody.ts
│   │   └── isPrismaUniqueViolation.ts
│   ├── utils/seededRandom.ts
│   ├── prisma.ts
│   └── datasources/
│       ├── types.ts
│       ├── validate-load-filters.ts
│       ├── fab.ts
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts            # coverage ≥60% lines on lib/ + app/api/
├── package.json
├── AGENTS.md / CLAUDE.md
├── README.md
├── project_content.md
└── docs/
```

## Datasource plugins

Defined in `lib/datasources/types.ts`:

- **`DataSourcePlugin`**: `id`, `name`, `describeLoadFilters?()`, `loadCards(filters)`.
- **`CardDTO`**: in-memory/API transport — `id`, `name`, `imageUrl`, `setLabel?` (e.g. FAB set); **does not** imply a DB table.
- **`LoadFilterField`**: declarative selects for UI + server validation.

Registry: `lib/datasources/index.ts` → `dataSources[]`.

## Flesh and Blood (`lib/datasources/fab.ts`)

- Required **`set`** filter (release).
- Dedupe by displayed **name**; **pitch** variants → one row (prefers lower pitch, then `cardIdentifier`).
- Images: `https://content.fabrary.net/cards/{CODE}.webp`.
- No product code → placeholder.

## HTTP API

### `GET /api/datasources`

`{ dataSources: [{ id, name, loadFilters }] }`

### `POST /api/datasources/load`

Body: `{ sourceId, filters? }` → `{ count, cards }` with `dataSourceId` on each item. **No persistence.**

### `POST /api/puzzles/get-or-create`

Body: `{ dataSource, card: { id, name, imageUrl } }`. Lookup by `@@unique([dataSource, externalCardId])`; if missing, creates puzzle + steps. Response: `{ puzzleId, seed, cardName, imageUrl, steps }`.

### `POST /api/puzzles/bulk-generate`

Body: `{ sourceId, filters }` (same shape as **datasources/load**). Loads all cards from the plugin, dedupes by card id, one DB query for existing puzzles, then in **batches of 30**: sets **`savedAt`** on existing **draft** rows, and **creates** missing puzzles + steps (also with **`savedAt`**). Rows already saved are unchanged. Response: `{ ok, dataSource, totalCards, uniqueCards, created, draftsSaved, alreadySaved, batchSize, errors[] }`.

### `POST /api/puzzles/regenerate`

Body: `{ puzzleId }`. New `seed`, deletes old steps, creates 15 new steps. Returns updated puzzle.

### `POST /api/puzzles/delete`

Body: `{ puzzleId }`. Deletes puzzle (cascade steps).

### `POST /api/puzzles/save`

Body: `{ puzzleId }`. Sets `savedAt` (puzzle “published” on the home catalog).

### `POST /api/puzzles/lookup`

Body: `{ dataSource, externalCardIds: string[] }`. Response `{ cards: Record<externalId, { puzzleId, saved } | null> }`.

## Database (`prisma/schema.prisma`)

- **`Puzzle`**: cuid, `dataSource`, `externalCardId`, `cardName`, `imageUrl`, `seed`, `createdAt`, `savedAt?` (explicit save in admin), `steps`; `@@unique([dataSource, externalCardId])`.
- **`PuzzleStep`**: `puzzleId`, `step` 1–15, `blur`, `brightness`; `@@unique([puzzleId, step])`; `onDelete: Cascade`.

Sync schema: `npx prisma db push` (or migrations). After schema changes: `npx prisma generate` (`postinstall` runs after `npm install`).

## Frontend (`app/page.tsx`)

- Loads sources and dynamic filters.
- **Load cards** fills local grid state.
- Changing source/filters clears preview until you load again.
- Per card: **Open Puzzle** → `get-or-create` → `/puzzles/[id]` (step grid with per-zone overlays; `generateRegions` on server → props to client tile; puzzle regenerate / delete).

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production |
| `npm run lint` | ESLint |
| `npm run test:run` | Vitest (CI) |
| `npm run test:coverage` | Vitest + coverage (≥60% lines on `lib/` + `app/api/`) |
| `postinstall` | `prisma generate` |

## Conventions

- Alias `@/*` → repo root.
- Prisma 7: URL in `prisma.config.ts`; client with `PrismaPg` adapter in `lib/prisma.ts`.
- Next 16: check `node_modules/next/dist/docs/` if something differs from older docs (`AGENTS.md`).

## Out of scope (for now)

- Global puzzle list (only detail by id today).
- Auth, cache, server-side image processing.

---

*Aligned with the repo after removing the legacy `Card` model.*
