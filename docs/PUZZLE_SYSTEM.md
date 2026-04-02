# Puzzle system

## Persistence (Prisma)

**`Puzzle`**: `id`, `dataSource`, `fabSet?` (FAB set code when known; set from plugin `setLabel` on create), `externalCardId`, `cardName`, `imageUrl`, `seed`, `createdAt`; `steps` relation; `@@unique([dataSource, externalCardId])`.

**`PuzzleStep`**: `puzzleId`, `step` (1–`PUZZLE_STEP_COUNT`, currently **15**), `blur`, `brightness` (floats); `@@unique([puzzleId, step])`; `onDelete: Cascade`.

> The preview UI **does not** use row `blur`/`brightness` for drawing: they exist for API compatibility and values derived from `generateSteps(seed)`.

## Generation

| Module | Role |
|--------|------|
| `lib/puzzle/deterministicStep.ts` | **`PUZZLE_STEP_COUNT`**, **`getShuffledCells`**, **`generateStep`**: stateless `Region[]` from `seed` + `step`. |
| `lib/puzzle/generateRegions.ts` | Thin wrapper: `generateStep(puzzleSeed, step).regions`. |
| `lib/puzzle/generateSteps.ts` | Emits `PUZZLE_STEP_COUNT` rows `{ step, blur, brightness }` for APIs (deterministic from `seed`). |
| `lib/utils/seededRandom.ts` | Deterministic PRNG from string seed (same seed → same sequence in Node and browser). |

## Preview on `/puzzles/[id]`

1. **Base image**: always full tile (`object-cover`).
2. **Overlays**: `generateRegions(puzzle.seed, step)` in the **Server Component**; serialized props to the client tile. No per-step regenerate UI: overlays are a pure function of `seed` + `step`.

For a **separate game client** that must match this behavior, see **[GAME_CLIENT_SPEC.md](./GAME_CLIENT_SPEC.md)**.

## Key files

```
lib/puzzle/
├── deterministicStep.ts      # shuffle + scripted 15-step state
├── generateRegions.ts
├── generateSteps.ts
├── regionTypes.ts
├── effects/
│   ├── types.ts
│   └── getEffectsForStep.ts  # unused by preview; optional
├── zones/
│   └── fabZones.ts
├── parsePuzzleCardBody.ts
└── isPrismaUniqueViolation.ts

app/puzzles/[id]/
├── page.tsx                   # generateRegions here → props
└── puzzle-step-tile.tsx       # Client: render + onError on img
```

## Related API

- `POST /api/puzzles/get-or-create` — creates puzzle + steps via `generateSteps`.
- `POST /api/puzzles/bulk-generate` — same filters as datasource load; **saves drafts** (`savedAt`) for existing puzzles that were still draft, **creates** missing puzzles in batches of **30** (new rows also get **`savedAt`**). Already-saved puzzles are unchanged.
- `POST /api/puzzles/regenerate` — new `seed` + steps.
- `POST /api/puzzles/delete` — deletes puzzle.

See `project_content.md` for request/response bodies.

## Migration note

Puzzles created before **15** steps may have fewer `PuzzleStep` rows; the UI only renders steps present in the DB. **Regenerate puzzle** replaces all steps with a fresh **15**-row set.

After pulling the removal of `PuzzleStep.stepVariant`, run **`npm run db:migrate`** (or **`npm run db:migrate:deploy`**) so the column is dropped from PostgreSQL.
