# Documentation — image-guess-admin

Living documentation index: keep it aligned with the code. See [MAINTENANCE.md](./MAINTENANCE.md) for the update protocol (humans and AI).

## Contents

| Document | Coverage |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, flows, server/client boundaries, principles |
| [DEPLOY.md](./DEPLOY.md) | Public deploy, Basic Auth, Vercel / GitHub Actions |
| [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md) | Database, step generation, preview, hydration |
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

- If you change **puzzle** code (zones, effects, `generateRegions`, `generateSteps`, `/puzzles/[id]` UI): update at least `PUZZLE_SYSTEM.md`, and if applicable `ZONES_FAB.md` and/or `EFFECTS_SYSTEM.md`. Add or extend **`*.test.ts`** when behavior is non-trivial.
- If you change **API** or **Prisma**: `project_content.md` + `README.md` (API table) + the relevant section in `ARCHITECTURE.md` or `PUZZLE_SYSTEM.md`.
