import { describe, expect, it } from "vitest";

import { generateRegions } from "./generateRegions";
import { generateStep } from "./deterministicStep";

describe("generateRegions", () => {
  it("matches generateStep(...).regions", () => {
    const seed = "puzzle-regions";
    for (const step of [1, 5, 15]) {
      expect(generateRegions(seed, step)).toEqual(
        generateStep(seed, step).regions,
      );
    }
  });
});
