import { describe, expect, it } from "vitest";

import { resolveFabSet } from "./resolveFabSet";

describe("resolveFabSet", () => {
  it("uses card setLabel when present (authoritative)", () => {
    expect(
      resolveFabSet("fab", { set: "ROS" }, { setLabel: "WTR" }),
    ).toBe("WTR");
  });

  it("falls back to FAB filter set when card has no setLabel", () => {
    expect(resolveFabSet("fab", { set: " ROS " }, {})).toBe("ROS");
  });

  it("returns null for FAB when both missing", () => {
    expect(resolveFabSet("fab", {}, {})).toBeNull();
  });

  it("uses only card setLabel for non-fab (ignores filter key set)", () => {
    expect(resolveFabSet("other", { set: "X" }, { setLabel: "Y" })).toBe("Y");
  });

  it("non-fab with no card setLabel is null even if filter has set", () => {
    expect(resolveFabSet("other", { set: "X" }, {})).toBeNull();
  });
});
