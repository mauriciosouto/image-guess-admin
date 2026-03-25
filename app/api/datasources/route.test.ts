import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/datasources", () => ({
  dataSources: [
    {
      id: "fab",
      name: "Flesh and Blood",
      describeLoadFilters: vi.fn(async () => [
        {
          kind: "select" as const,
          id: "set",
          label: "Set",
          required: true,
          options: [{ value: "WTR", label: "Welcome to Rathe" }],
        },
      ]),
    },
  ],
}));

import { GET } from "./route";

describe("GET /api/datasources", () => {
  it("returns sources with loadFilters", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      dataSources: Array<{ id: string; name: string; loadFilters: unknown[] }>;
    };
    expect(body.dataSources).toHaveLength(1);
    expect(body.dataSources[0]?.id).toBe("fab");
    expect(body.dataSources[0]?.loadFilters.length).toBeGreaterThan(0);
  });
});
