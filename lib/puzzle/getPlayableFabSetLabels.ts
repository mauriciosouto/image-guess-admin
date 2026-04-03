import { prisma } from "@/lib/prisma";

/**
 * Distinct **`Puzzle.fabSet`** for FAB puzzles that are saved and active.
 * Same rules as `GET /api/puzzles/fab-sets` and `GET /api/single/sets` — not the global FAB card-package set list.
 */
export async function getPlayableFabSetLabels(): Promise<string[]> {
  const rows = await prisma.puzzle.groupBy({
    by: ["fabSet"],
    where: {
      dataSource: "fab",
      fabSet: { not: null },
      savedAt: { not: null },
      isActive: true,
    },
    orderBy: { fabSet: "asc" },
  });

  return rows
    .map((r) => r.fabSet)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}
