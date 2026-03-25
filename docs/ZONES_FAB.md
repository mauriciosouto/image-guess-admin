# FAB zones (layout in %)

Top-left origin; `width` / `height` as a percentage of the card frame in the tile (`aspect-[5/7]`).

Canonical definition: **`lib/puzzle/zones/fabZones.ts`** (`FAB_ZONES`).

| id | x | y | w | h | Notes |
|----|---|---|---|---|-------|
| pitch | 0 | 0 | 20 | 12 | Blackout until step **7** (`deterministicStep`) |
| name | 20 | 0 | 60 | 12 | `alwaysHidden` → always blackout |
| cost | 80 | 0 | 20 | 12 | Blackout until step **2** |
| art | 0 | 12 | 100 | 74 | **16** cells (4×4; see `deterministicStep.ts`) |
| type | 23 | 86 | 54 | 6.3 | `alwaysHidden` → always blackout (narrower vs 22.4 attack/defense) |
| attack | 0 | 86 | 22.4 | 14.28 | Blackout until step **11** (+2pp width vs 20.4) |
| defense | 77.6 | 86 | 22.4 | 14.28 | Blackout until step **6** (+2pp width vs 20.4) |
| cardInfo | 23 | 93 | 54 | 6.3 | `alwaysHidden`; aligned with **type** |

## Deterministic preview (`deterministicStep.ts`)

- **`PUZZLE_STEP_COUNT`**: **15** global steps.
- **`getShuffledCells(seed)`**: Fisher–Yates shuffle of `[0,…,15]`; slot `k` refers to **physical** cell index `cells[k]` (row-major `0..15` in the art rectangle).
- **`generateStep(seed, step)`**: rebuilds **full** overlay state from scratch (no dependency on previous steps).
- **`generateRegions(puzzleSeed, step)`** returns `generateStep(...).regions` from `seed` + `step` only.

Global rules: **name**, **type**, **cardInfo** always hidden; **full card image** is always drawn under overlays.

## Iteration order

`generateStep` walks `FAB_ZONES` in array order, then emits art cell regions for indices `0..15`.

Scripted steps (cumulative; recomputed each time from `step`):

| Step | Art (reveal-order slots `cells[i]`) | Stats |
|------|-------------------------------------|-------|
| 1 | All cells heavy blur | All hidden |
| 2 | Same | **cost** visible |
| 3 | `cells[0]` clear; `cells[1]` invert; `cells[2]` light blur | |
| 4 | `cells[0]`,`cells[3]` clear (+ prior) | |
| 5 | `cells[4]` visible + rotate 180° | |
| 6 | | **defense** visible |
| 7 | `cells[5]` visible + invert | **pitch** visible |
| 8 | `cells[6]` visible | |
| 9 | `cells[7]` visible; `cells[1]` normal | |
| 10 | `cells[8]` visible; `cells[2]` normal | |
| 11 | `cells[9]` visible | **attack** visible |
| 12 | `cells[10]` visible; `cells[4]` normal | |
| 13 | `cells[11]` visible; `cells[12]` light blur + rotate | |
| 14 | `cells[12]` visible; `cells[13]` light blur + rotate | |
| 15 | `cells[14]` visible; `cells[13]` normal; any remaining heavy-blur cell cleared | |

Constants: **`ART_HEAVY_BLUR_PX`**, **`ART_LIGHT_BLUR_PX`** in `deterministicStep.ts`.
