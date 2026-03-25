import { describe, expect, it } from "vitest";

import { parsePuzzleCardBody } from "./parsePuzzleCardBody";

describe("parsePuzzleCardBody", () => {
  it("accepts a valid body", () => {
    const r = parsePuzzleCardBody({
      dataSource: " fab ",
      card: {
        id: " x ",
        name: " Name ",
        imageUrl: " https://x ",
      },
    });
    expect("error" in r).toBe(false);
    if ("error" in r) return;
    expect(r.dataSource).toBe("fab");
    expect(r.card).toEqual({
      id: "x",
      name: "Name",
      imageUrl: "https://x",
    });
  });

  it("rejects invalid bodies", () => {
    expect(parsePuzzleCardBody(null)).toMatchObject({
      error: "Invalid JSON body",
      status: 400,
    });
    expect(parsePuzzleCardBody({})).toMatchObject({
      error: "Missing or invalid dataSource",
      status: 400,
    });
    expect(
      parsePuzzleCardBody({
        dataSource: "fab",
        card: null,
      }),
    ).toMatchObject({ status: 400 });
    expect(
      parsePuzzleCardBody({
        dataSource: "fab",
        card: { id: "", name: "n", imageUrl: "u" },
      }),
    ).toMatchObject({ status: 400 });
  });
});
