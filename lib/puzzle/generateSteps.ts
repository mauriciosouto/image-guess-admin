import { createSeededRandom } from "@/lib/utils/seededRandom";

import { PUZZLE_STEP_COUNT } from "./deterministicStep";

export type PuzzleStepValues = {
  step: number;
  blur: number;
  brightness: number;
};

function computeStepRow(
  step: number,
  rand: () => number,
): Pick<PuzzleStepValues, "blur" | "brightness"> {
  const progress = step / PUZZLE_STEP_COUNT;
  const blur = 1 + progress * 2.2 + rand() * 0.75;
  const brightness = Math.min(
    0.98,
    0.38 + progress * 0.5 + rand() * 0.06,
  );
  return { blur, brightness };
}

/** One row per global step for the DB, deterministic from `seed`. */
export function generateSteps(seed: string): PuzzleStepValues[] {
  const steps: PuzzleStepValues[] = [];
  for (let i = 0; i < PUZZLE_STEP_COUNT; i++) {
    const step = i + 1;
    const rand = createSeededRandom(`${seed}:steps:${step}`);
    steps.push({ step, ...computeStepRow(step, rand) });
  }
  return steps;
}
