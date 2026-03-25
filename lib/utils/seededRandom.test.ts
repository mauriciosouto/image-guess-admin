import { describe, expect, it } from "vitest";

import { createSeededRandom } from "./seededRandom";

describe("createSeededRandom", () => {
  it("returns values in [0, 1)", () => {
    const rand = createSeededRandom("test-seed");
    for (let i = 0; i < 50; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for the same seed string", () => {
    const a = createSeededRandom("puzzle-abc");
    const b = createSeededRandom("puzzle-abc");
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("differs for different seeds", () => {
    const a = createSeededRandom("seed-a");
    const b = createSeededRandom("seed-b");
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});
