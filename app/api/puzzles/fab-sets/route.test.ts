import { beforeEach, describe, expect, it, vi } from "vitest";

const getPlayableFabSetLabels = vi.hoisted(() => vi.fn());

vi.mock("@/lib/puzzle/getPlayableFabSetLabels", () => ({
  getPlayableFabSetLabels,
}));

import { GET } from "./route";

describe("GET /api/puzzles/fab-sets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { fabSets } from getPlayableFabSetLabels", async () => {
    getPlayableFabSetLabels.mockResolvedValueOnce([
      "History Pack 1",
      "Welcome to Rathe",
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { fabSets: string[] };
    expect(body.fabSets).toEqual(["History Pack 1", "Welcome to Rathe"]);
    expect(getPlayableFabSetLabels).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when query fails", async () => {
    getPlayableFabSetLabels.mockRejectedValueOnce(new Error("db down"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
