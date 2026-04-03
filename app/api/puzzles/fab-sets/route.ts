import { NextResponse } from "next/server";

import { getPlayableFabSetLabels } from "@/lib/puzzle/getPlayableFabSetLabels";

/**
 * Distinct **`fabSet`** on **FAB** puzzles only (`dataSource === "fab"`).
 * Same data as **`GET /api/single/sets`** (`sets`); use either path from the game client.
 */
export async function GET() {
  try {
    const fabSets = await getPlayableFabSetLabels();
    return NextResponse.json({ fabSets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
