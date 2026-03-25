import { describe, expect, it } from "vitest";

import { PUZZLE_STEP_COUNT } from "./deterministicStep";
import { generateSteps } from "./generateSteps";

describe("generateSteps", () => {
  it("emits PUZZLE_STEP_COUNT rows with steps 1..N", () => {
    const rows = generateSteps("my-seed");
    expect(rows).toHaveLength(PUZZLE_STEP_COUNT);
    for (let i = 0; i < rows.length; i++) {
      expect(rows[i]!.step).toBe(i + 1);
      expect(rows[i]!.blur).toBeGreaterThan(0);
      expect(rows[i]!.brightness).toBeGreaterThan(0);
      expect(rows[i]!.brightness).toBeLessThanOrEqual(0.98);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateSteps("same");
    const b = generateSteps("same");
    expect(a).toEqual(b);
  });

  it("blur increases loosely with step index (same seed)", () => {
    const rows = generateSteps("mono");
    expect(rows[14]!.blur).toBeGreaterThanOrEqual(rows[0]!.blur);
  });
});
