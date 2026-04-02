# Documentation — image-guess-admin

Living documentation index: keep it aligned with the code. See [MAINTENANCE.md](./MAINTENANCE.md) for the update protocol (humans and AI).

## Contents

| Document | Coverage |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, flows, server/client boundaries, principles |
| [DEPLOY.md](./DEPLOY.md) | Public deploy, Basic Auth, Vercel / GitHub Actions |
| [SHARED_DATABASE.md](./SHARED_DATABASE.md) | Game owns migrations; admin mirrors schema / migration files |
| [PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./PROMPT_GAME_MIGRATION_FROM_ADMIN.md) | Short template for a **one-off** DDL request in the **game** repo |
| [PROMPT_GAME_REPO_FULL.md](./PROMPT_GAME_REPO_FULL.md) | **Full prompt** for the game repo: migration ownership + `fabSet` + docs |
| [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md) | Database, step generation, preview, hydration |
| [GAME_CLIENT_SPEC.md](./GAME_CLIENT_SPEC.md) | **Game app**: data contract, porting `generateRegions`, rendering parity |
| [ZONES_FAB.md](./ZONES_FAB.md) | Coordinates and rules per zone on FAB cards |
| [EFFECTS_SYSTEM.md](./EFFECTS_SYSTEM.md) | Effect types, per-step pools, rendering |
| [ROADMAP.md](./ROADMAP.md) | Done vs future ideas (not commitments) |
| [MAINTENANCE.md](./MAINTENANCE.md) | **When and what to update** after each change |

## Root-level docs

- **[../README.md](../README.md)** — quick start, API summary, scripts.
- **[../project_content.md](../project_content.md)** — compact context + repo tree (keep in sync with `docs/` when touching the same areas).

## Tests

- **`vitest`** — `npm run test:run` / `npm run test:coverage`. Unit tests: puzzle math, parsers, datasource filter validation; **integration-style** tests call route handlers with mocked `prisma` / plugins. Config: `vitest.config.ts`.

## Convention

- If you change **puzzle** code (zones, effects, `generateRegions`, `generateSteps`, `/puzzles/[id]` UI): update at least `PUZZLE_SYSTEM.md`, and if applicable `ZONES_FAB.md`, `EFFECTS_SYSTEM.md`, and **`GAME_CLIENT_SPEC.md`** when game-client behavior or contracts change. Add or extend **`*.test.ts`** when behavior is non-trivial.
- If you change **API** or **Prisma**: `project_content.md` + `README.md` (API table) + the relevant section in `ARCHITECTURE.md` or `PUZZLE_SYSTEM.md`. **Schema / DDL:** use **[PROMPT_GAME_MIGRATION_FROM_ADMIN.md](./PROMPT_GAME_MIGRATION_FROM_ADMIN.md)** in the game repo; then sync mirrored files in admin per **[SHARED_DATABASE.md](./SHARED_DATABASE.md)**.
