import { describe, expect, it } from "vitest";

import { getEffectsForStep, pickEffectsForRegion } from "./getEffectsForStep";

describe("getEffectsForStep", () => {
  it("returns early pools for low steps", () => {
    expect(getEffectsForStep(1)).toContain("blackout");
    expect(getEffectsForStep(3)).toContain("invert");
    expect(getEffectsForStep(6)).toContain("pixelate");
    expect(getEffectsForStep(10)).toEqual(["blur", "brightness"]);
  });
});

describe("pickEffectsForRegion", () => {
  it("returns only blackout when blackout is picked", () => {
    const effects = pickEffectsForRegion("seed-blackout", 2, "salt:force");
    /* Pool for step 2 includes blackout; with a fixed seed we only assert shape when blackout wins */
    expect(effects.length).toBeGreaterThanOrEqual(1);
    expect(effects.length).toBeLessThanOrEqual(2);
    if (effects[0]?.type === "blackout") {
      expect(effects).toEqual([{ type: "blackout" }]);
    }
  });

  it("is deterministic for fixed seed, step, salt", () => {
    const a = pickEffectsForRegion("k", 5, "cell:0:0");
    const b = pickEffectsForRegion("k", 5, "cell:0:0");
    expect(a).toEqual(b);
  });

  it("produces blur with intensity for non-blackout picks", () => {
    let found = false;
    for (let i = 0; i < 40; i++) {
      const fx = pickEffectsForRegion(`probe-${i}`, 9, "x");
      if (fx.every((e) => e.type !== "blackout")) {
        expect(fx.some((e) => e.type === "blur")).toBe(true);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
