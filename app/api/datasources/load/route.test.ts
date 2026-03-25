import { beforeEach, describe, expect, it, vi } from "vitest";

const loadCards = vi.hoisted(() =>
  vi.fn(async () => [{ id: "x", name: "X", imageUrl: "http://x" }]),
);

vi.mock("@/lib/datasources", () => ({
  dataSources: [
    {
      id: "fab",
      name: "FAB",
      describeLoadFilters: vi.fn(async () => []),
      loadCards,
    },
  ],
}));

import { POST } from "./route";

describe("POST /api/datasources/load", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 without sourceId", async () => {
    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({ filters: {} }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns cards with dataSourceId", async () => {
    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({ sourceId: "fab", filters: {} }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      count: number;
      cards: Array<{ id: string; dataSourceId: string }>;
    };
    expect(body.count).toBe(1);
    expect(body.cards[0]?.dataSourceId).toBe("fab");
  });
});
