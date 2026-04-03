import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    puzzle: {
      findFirst,
      create,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/puzzles/get-or-create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns existing puzzle without creating", async () => {
    findFirst.mockResolvedValueOnce({
      id: "existing",
      seed: "s",
      cardName: "N",
      imageUrl: "u",
      fabSet: "WTR",
      savedAt: null,
      steps: [
        { step: 1, blur: 1, brightness: 0.5 },
        { step: 2, blur: 2, brightness: 0.6 },
      ],
    });

    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          card: { id: "c1", name: "N", imageUrl: "u" },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      puzzleId: string;
      fabSet: string | null;
      steps: unknown[];
    };
    expect(body.puzzleId).toBe("existing");
    expect(body.fabSet).toBe("WTR");
    expect(body.steps).toHaveLength(2);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates when missing", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      id: "new-id",
      seed: "generated-uuid",
      cardName: "Card",
      imageUrl: "http://i",
      fabSet: "WTR",
      savedAt: null,
      steps: Array.from({ length: 15 }, (_, i) => ({
        step: i + 1,
        blur: 1,
        brightness: 0.5,
      })),
    });

    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          card: {
            id: "new",
            name: "Card",
            imageUrl: "http://i",
            setLabel: "WTR",
          },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { puzzleId: string };
    expect(body.puzzleId).toBe("new-id");
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0]?.data).toMatchObject({
      fabSet: "WTR",
    });
  });

  it("persists fabSet from card.setLabel over root fabSet when creating", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      id: "id",
      seed: "s",
      cardName: "C",
      imageUrl: "http://i",
      fabSet: "WTR",
      savedAt: null,
      steps: [],
    });

    const res = await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          fabSet: "ROS",
          card: {
            id: "x",
            name: "C",
            imageUrl: "http://i",
            setLabel: "WTR",
          },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(create.mock.calls[0]?.[0]?.data).toMatchObject({ fabSet: "WTR" });
    const body = (await res.json()) as { fabSet: string | null };
    expect(body.fabSet).toBe("WTR");
  });

  it("persists fabSet from root body when card has no setLabel", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      id: "id2",
      seed: "s",
      cardName: "C",
      imageUrl: "http://i",
      fabSet: "ROS",
      savedAt: null,
      steps: [],
    });

    await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          fabSet: "ROS",
          card: { id: "y", name: "C", imageUrl: "http://i" },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(create.mock.calls[0]?.[0]?.data).toMatchObject({ fabSet: "ROS" });
  });

  it("saves fabSet null when no set on card or body", async () => {
    findFirst.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({
      id: "id3",
      seed: "s",
      cardName: "C",
      imageUrl: "http://i",
      fabSet: null,
      savedAt: null,
      steps: [],
    });

    await POST(
      new Request("http://t", {
        method: "POST",
        body: JSON.stringify({
          dataSource: "fab",
          card: { id: "z", name: "C", imageUrl: "http://i" },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(create.mock.calls[0]?.[0]?.data).toMatchObject({ fabSet: null });
  });
});
