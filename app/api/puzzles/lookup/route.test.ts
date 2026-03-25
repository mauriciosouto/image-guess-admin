import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    puzzle: {
      findMany,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/puzzles/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when dataSource or ids missing", async () => {
    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({ dataSource: "fab", externalCardIds: [] }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("maps puzzles to lookup shape", async () => {
    findMany.mockResolvedValueOnce([
      { id: "p1", externalCardId: "a", savedAt: null },
      { id: "p2", externalCardId: "b", savedAt: new Date() },
    ]);

    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          externalCardIds: ["a", "b", "c"],
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      cards: Record<string, { puzzleId: string; saved: boolean } | null>;
    };
    expect(body.cards.a).toEqual({ puzzleId: "p1", saved: false });
    expect(body.cards.b).toEqual({ puzzleId: "p2", saved: true });
    expect(body.cards.c).toBeNull();
  });
});
