# Documentation maintenance

Goal: keep `docs/`, `README.md`, and `project_content.md` accurate for the repo.

## Triggers (update docs when…)

| Code change | Update |
|-------------|--------|
| `prisma/schema.prisma`, `prisma/migrations/*`, `app/api/puzzles/*` routes, home bulk-create UI | `PUZZLE_SYSTEM.md`, `GAME_CLIENT_SPEC.md` (if `Puzzle` fields), `project_content.md`, API table in `README.md`, **`docs/DEPLOY.md`**, **`docs/SHARED_DATABASE.md`**, **`docs/PROMPT_GAME_REPO_FULL.md`** / **`PROMPT_GAME_MIGRATION_FROM_ADMIN.md`** (if game-prompt workflow changes) |
| `savedAt` / save flow | `PUZZLE_SYSTEM.md`, copy in `app/page.tsx` / puzzle detail |
| `lib/puzzle/zones/fabZones.ts` | `ZONES_FAB.md`, summary in `project_content.md` |
| `lib/puzzle/deterministicStep.ts` | `ZONES_FAB.md`, `PUZZLE_SYSTEM.md`, `EFFECTS_SYSTEM.md`, **`GAME_CLIENT_SPEC.md`** |
| `lib/puzzle/effects/getEffectsForStep.ts` (art cells) | `EFFECTS_SYSTEM.md` |
| `lib/puzzle/effects/*`, `regionTypes.ts` | `EFFECTS_SYSTEM.md`, `PUZZLE_SYSTEM.md` |
| `lib/puzzle/generateRegions.ts` | `PUZZLE_SYSTEM.md`, `ZONES_FAB.md`, **`GAME_CLIENT_SPEC.md`** |
| `lib/puzzle/generateSteps.ts` | `PUZZLE_SYSTEM.md` |
| `vitest.config.ts`, new `**/*.test.ts` | `docs/README.md`, `README.md`, `project_content.md`, `ARCHITECTURE.md` |
| `middleware.ts`, `.github/workflows/*`, `docs/DEPLOY.md` | `DEPLOY.md`, root `README.md`, `docs/README.md` |
| `app/puzzles/[id]/*` (page, tile, hydration) | `PUZZLE_SYSTEM.md`, **`GAME_CLIENT_SPEC.md`** (rendering contract), `ARCHITECTURE.md` if RSC/client pattern changes |
| New datasource or datasources API contract | `ARCHITECTURE.md`, `project_content.md` |
| Product “coming soon” decisions | `ROADMAP.md` (mark as idea, not shipped) |

## Quick checklist after a PR / change

1. Do zone percentages in `ZONES_FAB.md` match `fabZones.ts`?
2. Do effect types in `EFFECTS_SYSTEM.md` match `lib/puzzle/effects/types.ts`?
3. Does the Prisma model in `PUZZLE_SYSTEM.md` match `schema.prisma`?
4. Do `project_content.md` and `README.md` still match the UI flow?
5. Run **`npm run test:coverage`** — keep **lines/statements** coverage ≥ **60%** on the included globs (`vitest.config.ts`).

## AI / agents

In this repo, `AGENTS.md` says that when you change the areas above, you should **update the same docs** in the same change (same PR / session), not defer.
