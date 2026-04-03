import { beforeEach, describe, expect, it, vi } from "vitest";

const groupBy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    puzzle: { groupBy },
  },
}));

import { getPlayableFabSetLabels } from "./getPlayableFabSetLabels";

describe("getPlayableFabSetLabels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries fab puzzles with correct where clause", async () => {
    groupBy.mockResolvedValueOnce([
      { fabSet: "A" },
      { fabSet: "B" },
    ]);

    const out = await getPlayableFabSetLabels();
    expect(out).toEqual(["A", "B"]);
    expect(groupBy).toHaveBeenCalledWith({
      by: ["fabSet"],
      where: {
        dataSource: "fab",
        fabSet: { not: null },
        savedAt: { not: null },
        isActive: true,
      },
      orderBy: { fabSet: "asc" },
    });
  });

  it("drops null/empty fabSet entries", async () => {
    groupBy.mockResolvedValueOnce([
      { fabSet: "X" },
      { fabSet: null },
      { fabSet: "" },
    ]);

    const out = await getPlayableFabSetLabels();
    expect(out).toEqual(["X"]);
  });
});
