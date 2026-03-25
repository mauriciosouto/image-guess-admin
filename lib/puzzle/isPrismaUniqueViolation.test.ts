import { describe, expect, it } from "vitest";

import { isPrismaUniqueViolation } from "./isPrismaUniqueViolation";

describe("isPrismaUniqueViolation", () => {
  it("returns true for Prisma P2002 shape", () => {
    expect(isPrismaUniqueViolation({ code: "P2002" })).toBe(true);
  });

  it("returns false for other codes and non-objects", () => {
    expect(isPrismaUniqueViolation({ code: "P2025" })).toBe(false);
    expect(isPrismaUniqueViolation(null)).toBe(false);
    expect(isPrismaUniqueViolation(undefined)).toBe(false);
    expect(isPrismaUniqueViolation("error")).toBe(false);
    expect(isPrismaUniqueViolation(new Error("x"))).toBe(false);
  });
});
