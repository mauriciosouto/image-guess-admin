import { createSeededRandom } from "@/lib/utils/seededRandom";

import type { Effect } from "./types";
import type { StepEffectKind } from "./types";

export function getEffectsForStep(step: number): StepEffectKind[] {
  if (step <= 3) return ["blackout", "pixelate", "invert"];
  if (step <= 6) return ["blur", "pixelate", "brightness"];
  return ["blur", "brightness"];
}

function kindToEffect(
  kind: StepEffectKind,
  step: number,
  rand: () => number,
): Effect {
  const w = (11 - step) / 10;
  switch (kind) {
    case "blackout":
      return { type: "blackout" };
    case "blur":
      return { type: "blur", intensity: 1.2 + w * 11 + rand() * 2.2 };
    case "pixelate":
      return { type: "pixelate" };
    case "invert":
      return { type: "invert", intensity: 1 };
    case "brightness":
      if (step >= 8) {
        return { type: "brightness", intensity: 0.92 + rand() * 0.22 };
      }
      return {
        type: "brightness",
        intensity: 0.5 + rand() * 0.45 * w + 0.12,
      };
  }
}

/**
 * Picks 1–2 effects from `getEffectsForStep(step)`. Blackout dominates (sole effect).
 * Rotate is injected rarely (steps 4–7) so it stays uncommon.
 */
export function pickEffectsForRegion(
  seed: string,
  step: number,
  salt: string,
): Effect[] {
  const rand = createSeededRandom(`${seed}:fx:${step}:${salt}`);
  const pool = getEffectsForStep(step);
  const preferTwo = rand() < 0.52 && step <= 8;

  const pickKind = () => pool[Math.floor(rand() * pool.length)]!;
  const a = pickKind();
  let b: StepEffectKind | null = preferTwo ? pickKind() : null;
  let guard = 0;
  while (b != null && b === a && pool.length > 1 && guard++ < 10) {
    b = pickKind();
  }

  const kinds = b != null ? [a, b] : [a];
  if (kinds.includes("blackout")) {
    return [{ type: "blackout" }];
  }

  const effects = kinds.map((k) => kindToEffect(k, step, rand)).slice(0, 2);

  if (step >= 4 && step <= 7 && rand() < 0.1) {
    const rot: Effect = {
      type: "rotate",
      intensity: 3 + rand() * 5,
    };
    if (effects.length === 1) {
      effects.push(rot);
    } else {
      effects[1] = rot;
    }
  }

  return effects.slice(0, 2);
}
