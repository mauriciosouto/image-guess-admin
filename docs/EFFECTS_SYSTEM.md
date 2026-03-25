# Effects system (preview)

## Model

Canonical types: **`lib/puzzle/effects/types.ts`**.

```ts
Effect = { type: EffectType; intensity?: number }
EffectType = "blur" | "pixelate" | "blackout" | "rotate" | "invert" | "brightness"
```

`Region` (`lib/puzzle/regionTypes.ts`) includes `effects: Effect[]` and optional `zIndex`.

## Current preview usage

**`lib/puzzle/deterministicStep.ts`** builds per-step **`Region[]`** from **`seed` + `step` only**:

- Zone **blackouts** for pitch / cost / attack / defense per the step table in **`ZONES_FAB.md`**.
- **Art**: up to **16** cell regions with **blur**, **invert**, and/or **rotate** (`180` for “rotate 180°”). Cells with no overlay are omitted (underlying full image shows).

**`getEffectsForStep`** / **`pickEffectsForRegion`** (`effects/getEffectsForStep.ts`) are **not** used by the live preview path anymore; kept for reference or future experiments.

## Render (`puzzle-step-tile.tsx`)

- **blackout**: black `div` over the % rectangle.
- **blur** (+ optional **brightness** / **invert** if present in the array): `filter` on a duplicate `<img>` aligned to the crop.
- **pixelate**: `image-rendering: pixelated` + `scale(1.1)` on the image.
- **rotate**: `transform: rotate(intensity deg)` on the cell wrapper.

Filter values are rounded when building the CSS string.

## Design rules (history / extensions)

- Deterministic art uses at most **two** stacked effects per cell where the script calls for blur + rotate.
- **Rotate** is applied on the wrapper so the cropped image rotates in place.
