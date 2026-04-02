import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const loadCards = vi.hoisted(() =>
  vi.fn(async () => [
    { id: "c1", name: "One", imageUrl: "http://1", setLabel: "WTR" },
    { id: "c2", name: "Two", imageUrl: "http://2", setLabel: "WTR" },
  ]),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    puzzle: {
      findMany,
      updateMany,
      create,
    },
  },
}));

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

function jsonReq(body: unknown) {
  return new Request("http://test.local/api/puzzles/bulk-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/puzzles/bulk-generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadCards.mockImplementation(async () => [
      { id: "c1", name: "One", imageUrl: "http://1", setLabel: "WTR" },
      { id: "c2", name: "Two", imageUrl: "http://2", setLabel: "WTR" },
    ]);
  });

  it("returns 400 when sourceId is missing", async () => {
    const res = await POST(jsonReq({ filters: {} }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown source", async () => {
    const res = await POST(jsonReq({ sourceId: "unknown", filters: {} }));
    expect(res.status).toBe(404);
  });

  it("creates rows when no puzzles exist", async () => {
    findMany.mockResolvedValueOnce([]);
    create.mockResolvedValue({});

    const res = await POST(jsonReq({ sourceId: "fab", filters: {} }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      created: number;
      draftsSaved: number;
      alreadySaved: number;
      totalCards: number;
    };
    expect(body.totalCards).toBe(2);
    expect(body.created).toBe(2);
    expect(body.draftsSaved).toBe(0);
    expect(body.alreadySaved).toBe(0);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]?.[0]?.data).toMatchObject({ fabSet: "WTR" });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("saves drafts and counts already-saved", async () => {
    findMany.mockResolvedValueOnce([
      { externalCardId: "c1", savedAt: null },
      { externalCardId: "c2", savedAt: new Date("2020-01-01") },
    ]);
    updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await POST(jsonReq({ sourceId: "fab", filters: {} }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      created: number;
      draftsSaved: number;
      alreadySaved: number;
    };
    expect(body.created).toBe(0);
    expect(body.draftsSaved).toBe(1);
    expect(body.alreadySaved).toBe(1);
    expect(updateMany).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("dedupes duplicate card ids from plugin", async () => {
    loadCards.mockResolvedValueOnce([
      { id: "c1", name: "One", imageUrl: "http://1" },
      { id: "c1", name: "One", imageUrl: "http://1" },
    ]);
    findMany.mockResolvedValueOnce([]);
    create.mockResolvedValue({});

    const res = await POST(jsonReq({ sourceId: "fab", filters: {} }));
    const body = (await res.json()) as { totalCards: number; uniqueCards: number };
    expect(body.totalCards).toBe(2);
    expect(body.uniqueCards).toBe(1);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
