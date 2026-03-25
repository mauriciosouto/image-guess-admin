import type { DataSourcePlugin } from "./types";

export async function validateLoadFilters(
  plugin: DataSourcePlugin,
  filters: Record<string, string>
): Promise<string | null> {
  const describe = plugin.describeLoadFilters;
  if (!describe) {
    return null;
  }

  const fields = await describe();

  for (const field of fields) {
    const raw = filters[field.id];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (field.required && !value) {
      return `Missing required filter: ${field.label}`;
    }

    if (field.kind === "select" && value) {
      const allowed = field.options.some((o) => o.value === value);
      if (!allowed) {
        return `Invalid value for ${field.label}`;
      }
    }
  }

  return null;
}
