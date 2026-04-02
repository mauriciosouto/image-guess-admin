# Game client specification

How a **separate game app** should render puzzle steps so it stays consistent with this admin repo. The admin **does not** store per-step image URLs; the client builds each step from **`Puzzle.imageUrl`**, **`Puzzle.seed`**, and the step index.

## Data model (from API / database)

| Field | Where | Use for rendering |
|-------|--------|-------------------|
| `imageUrl` | `Puzzle` | Full card art URL; **single** base image for every step. |
| `fabSet` | `Puzzle` | Optional. Flesh and Blood set code (e.g. `WTR`) for catalog or filters; **not** used for overlay math. |
| `seed` | `Puzzle` | Drives all determinism (region layout + art cell shuffle). |
| `step` | `PuzzleStep` | Integer **1..15** (see `PUZZLE_STEP_COUNT`). |
| `blur`, `brightness` | `PuzzleStep` | **Not** used by the admin preview overlays. Optional for your game if you want API parity or other effects. |
| `imageUrl` | `PuzzleStep` | Optional in schema; **not** populated by this admin. Do not rely on it. |

## Algorithm source of truth

Overlays are a **pure function** of `seed` + `step` only. Port or share these modules **without changing behavior**:

| Module | Role |
|--------|------|
| `lib/utils/seededRandom.ts` | `createSeededRandom(seedString)` — deterministic PRNG (same in Node and browser if ported exactly). |
| `lib/puzzle/zones/fabZones.ts` | `FAB_ZONES` — card zones as **percent** rectangles (`x`, `y`, `width`, `height`). |
| `lib/puzzle/effects/types.ts` | `Effect`: `blur`, `pixelate`, `blackout`, `rotate`, `invert`, `brightness`. |
| `lib/puzzle/regionTypes.ts` | `Region`: `id`, geometry in **% of card**, `effects[]`, optional `zIndex`. |
| `lib/puzzle/deterministicStep.ts` | `PUZZLE_STEP_COUNT` (**15**), `getShuffledCells(seed)`, `generateStep(seed, step)` → `{ cells, regions }`. |
| `lib/puzzle/generateRegions.ts` | `generateRegions(seed, step)` → `generateStep(seed, step).regions`. |

Shuffle string for art cell order: **`${seed}:cells:order`** (see `getShuffledCells`).

Constants used in generation (keep in sync):

- `ART_HEAVY_BLUR_PX = 28`
- `ART_LIGHT_BLUR_PX = 6`
- Art illustration: **4×4** grid (**16** cells) inside the `art` zone (indices `0..15`).

Zone behavior (high level — full logic is in code):

- **`name`**, **`type`**, **`cardInfo`**: `alwaysHidden` → full-zone **blackout** on every step.
- **Stat zones** (blackout until step threshold): `cost` &lt; 2, `pitch` &lt; 7, `defense` &lt; 6, `attack` &lt; 11.
- **`art`**: 16 cells; each cell’s effect stack evolves by global `step` per `cellEffectsForStep` in `deterministicStep.ts` (Fisher–Yates order from `getShuffledCells`).

## Rendering contract (match admin)

Reference implementation: `app/puzzles/[id]/puzzle-step-tile.tsx` (with regions from `generateRegions(puzzle.seed, step)` on the server in `page.tsx`).

### Base image

- One full-bleed image from **`imageUrl`** inside the card frame.
- **`object-fit: cover`**, **`object-position: top center`** (or equivalent).

### Regions

For each `Region` in `generateRegions(seed, step)`:

1. Position **`absolute`**; `left/top/width/height` = **`region.x` / `region.y` / `region.width` / `region.height`** as **percentages** of the **card container** (the same box as the base image).
2. Default `z-index`: **1** (or `region.zIndex` if set). Base image at **0**.

### Per-region effects

- **`blackout`**: draw a solid **black** rectangle for that geometry; no image clone.
- **Otherwise** (image-based overlay):
  - Clip with a wrapper matching the region; **`overflow: hidden`**.
  - **`rotate`**: apply `transform: rotate(intensity deg)` on the wrapper; `transform-origin: center center`. **`intensity`** is degrees (e.g. **180**).
  - Inside the wrapper, reuse the **same** full card image with **crop math** so the visible window shows only the region’s portion of the art:
    - `width: (100 / w) * 100%`, `height: (100 / h) * 100%`
    - `left: (-x / w) * 100%`, `top: (-y / h) * 100%`
    - where `x,y,w,h` are **`region.x/y/width/height`** (percent units consistent with admin).
  - **CSS `filter`**: combine, in order, from `blur`, `brightness`, `invert` in `region.effects`:
    - `blur(intensity px)` — intensity is pixel radius (generator uses **28** / **6**).
    - `brightness(intensity)` — default **1** if omitted.
    - `invert(intensity)` — often **1**.
  - **`pixelate`**: admin applies `image-rendering: pixelated` and a slight `scale(1.1)` on the inner image for parity.

Implement **`buildFilterString`** semantics like the admin: only `blur`, `brightness`, `invert` go into `filter`; `rotate` and `blackout` are handled separately; `pixelate` as above.

## Parity and testing

1. For fixed `(seed, step)`, serialized `generateRegions(seed, step)` must match this repo (golden JSON snapshot or hash).
2. Sanity: step **1** heavily obscures art; step **15** clears remaining heavy blur per `cellEffectsForStep`.
3. After any change to `deterministicStep.ts`, `fabZones.ts`, `regionTypes.ts`, or effect handling in `puzzle-step-tile.tsx`, update **this document** and the game client port (see [MAINTENANCE.md](./MAINTENANCE.md)).

## Related docs

- [PUZZLE_SYSTEM.md](./PUZZLE_SYSTEM.md) — persistence, APIs, preview flow in admin.
- [ZONES_FAB.md](./ZONES_FAB.md) — FAB zone layout details.
- [EFFECTS_SYSTEM.md](./EFFECTS_SYSTEM.md) — effect types and usage notes.
