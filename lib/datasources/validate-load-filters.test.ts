import { describe, expect, it } from "vitest";

import type { DataSourcePlugin } from "./types";
import { validateLoadFilters } from "./validate-load-filters";

describe("validateLoadFilters", () => {
  it("returns null when plugin has no describeLoadFilters", async () => {
    const plugin: DataSourcePlugin = {
      id: "x",
      name: "X",
      loadCards: async () => [],
    };
    expect(await validateLoadFilters(plugin, {})).toBeNull();
  });

  it("requires non-empty values for required fields", async () => {
    const plugin: DataSourcePlugin = {
      id: "x",
      name: "X",
      describeLoadFilters: async () => [
        {
          kind: "select",
          id: "set",
          label: "Set",
          required: true,
          options: [{ value: "A", label: "A" }],
        },
      ],
      loadCards: async () => [],
    };
    expect(await validateLoadFilters(plugin, {})).toBe(
      "Missing required filter: Set",
    );
    expect(await validateLoadFilters(plugin, { set: "  " })).toBe(
      "Missing required filter: Set",
    );
    expect(await validateLoadFilters(plugin, { set: "A" })).toBeNull();
  });

  it("rejects select values not in options", async () => {
    const plugin: DataSourcePlugin = {
      id: "x",
      name: "X",
      describeLoadFilters: async () => [
        {
          kind: "select",
          id: "set",
          label: "Set",
          required: false,
          options: [{ value: "A", label: "A" }],
        },
      ],
      loadCards: async () => [],
    };
    expect(await validateLoadFilters(plugin, { set: "Z" })).toBe(
      "Invalid value for Set",
    );
  });
});
