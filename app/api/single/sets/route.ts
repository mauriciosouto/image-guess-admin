import { NextResponse } from "next/server";

import { getPlayableFabSetLabels } from "@/lib/puzzle/getPlayableFabSetLabels";

/**
 * Puzzle-backed **FAB edition** labels for single-player filters.
 * Each string is a stored **`Puzzle.fabSet`** (not `dataSource`, not the global `@flesh-and-blood/cards` set list).
 * Only puzzles with **`dataSource === "fab"`**, **`savedAt`**, **`isActive`**, non-null **`fabSet`**.
 */
export async function GET() {
  try {
    const sets = await getPlayableFabSetLabels();
    return NextResponse.json({ sets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
