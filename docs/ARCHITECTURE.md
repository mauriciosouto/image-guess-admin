# Architecture

## Principles

- **Grid cards**: in memory / preview API; **no** `Card` table in the database.
- **Puzzles**: stored in PostgreSQL; lookup uses `(dataSource, externalCardId)`. **Player-facing FAB editions** use **`Puzzle.fabSet`**, not `dataSource` (see `GET /api/puzzles/fab-sets`, **`GAME_CLIENT_SPEC.md`**).
- **Puzzle preview**: does not call external APIs at runtime; only stored `imageUrl` + local generation from `seed`.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind 4**.
- **Prisma 7** + `@prisma/adapter-pg`; generated client in `app/generated/prisma` (gitignored). **Migrations are authored in the game repo**; admin mirrors **`prisma/migrations/`** for parity. See **`docs/SHARED_DATABASE.md`** and **`docs/PROMPT_GAME_MIGRATION_FROM_ADMIN.md`**.
- FAB data: `@flesh-and-blood/cards`.

## Main flow

1. Home (`app/page.tsx`): pick datasource → filters → `POST /api/datasources/load` → grid in local state.
2. **Open puzzle**: `POST /api/puzzles/get-or-create` → navigate to `/puzzles/[id]`.
3. Detail: Server Component loads puzzle + steps; computes `regions` per step and passes them to the client tile.

## Server vs client

- **Server**: `page.tsx` (Prisma), `generateRegions`, layouts without interactivity.
- **Tests**: Vitest (`*.test.ts`); API routes tested by importing `POST`/`GET` and `new Request(...)` with mocked `@/lib/prisma` / `@/lib/datasources` (no real DB in unit runs).
- **Client**: `puzzle-step-tile.tsx` (`onError` on images), `puzzle-actions.tsx`, home sections that call APIs with `fetch` from the browser.

**Hydration**: data that defines the puzzle step DOM (`regions` list) must be serialized from the server on the Client Component’s first render—do not recompute only on the client with `useMemo`, to avoid mismatches.

## Useful folders

| Path | Role |
|------|------|
| `app/api/` | REST routes (puzzles, datasources). |
| `app/puzzles/[id]/` | Puzzle detail. |
| `lib/datasources/` | Plugins (FAB, types, registry). |
| `lib/puzzle/` | Step generation, regions, zones, effects. |
| `lib/prisma.ts` | Singleton Prisma client. |
| `docs/` | Hand-maintained docs (see `MAINTENANCE.md`). |

## Next.js references

Behavior may differ from older versions: see `AGENTS.md` and the guide under `node_modules/next/dist/docs/`.
