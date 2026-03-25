import { NextResponse } from "next/server";

import { dataSources } from "@/lib/datasources";
import { validateLoadFilters } from "@/lib/datasources/validate-load-filters";

/**
 * Fetches cards from the plugin for preview only — does not write to the database.
 * Persistence will be added later when cards are explicitly saved.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceId?: string;
      filters?: Record<string, string>;
    };
    const sourceId = body.sourceId;
    const filters =
      body.filters && typeof body.filters === "object" && !Array.isArray(body.filters)
        ? Object.fromEntries(
            Object.entries(body.filters).map(([k, v]) => [
              k,
              typeof v === "string" ? v : String(v ?? ""),
            ])
          )
        : {};

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid sourceId" },
        { status: 400 }
      );
    }

    const plugin = dataSources.find((d) => d.id === sourceId);
    if (!plugin) {
      return NextResponse.json(
        { error: `Unknown data source: ${sourceId}` },
        { status: 404 }
      );
    }

    const filterError = await validateLoadFilters(plugin, filters);
    if (filterError) {
      return NextResponse.json({ error: filterError }, { status: 400 });
    }

    const cards = await plugin.loadCards(filters);

    const cardsWithSource = cards.map((card) => ({
      ...card,
      dataSourceId: plugin.id,
    }));

    return NextResponse.json({
      count: cards.length,
      cards: cardsWithSource,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
