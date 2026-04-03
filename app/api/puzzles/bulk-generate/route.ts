import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { dataSources } from "@/lib/datasources";
import { resolveFabSet } from "@/lib/datasources/resolveFabSet";
import { validateLoadFilters } from "@/lib/datasources/validate-load-filters";
import type { CardDTO } from "@/lib/datasources/types";
import { generateSteps } from "@/lib/puzzle/generateSteps";
import { isPrismaUniqueViolation } from "@/lib/puzzle/isPrismaUniqueViolation";
import { prisma } from "@/lib/prisma";

type BulkError = { externalCardId: string; message: string };

/** Process inserts / updates in chunks to bound memory / connection pressure. */
const BATCH_SIZE = 30;

async function updateDraftPuzzlesBatch(
  batchIds: string[],
  cardById: Map<string, CardDTO>,
  dataSource: string,
  filters: Record<string, string>,
  savedAt: Date,
): Promise<number> {
  const resolved = batchIds.map((id) =>
    resolveFabSet(dataSource, filters, cardById.get(id)),
  );
  const distinct = new Set(resolved);
  if (distinct.size <= 1) {
    const res = await prisma.puzzle.updateMany({
      where: {
        dataSource,
        externalCardId: { in: batchIds },
        savedAt: null,
      },
      data: {
        savedAt,
        fabSet: resolved[0] ?? null,
      },
    });
    return res.count;
  }

  let count = 0;
  for (let i = 0; i < batchIds.length; i++) {
    const res = await prisma.puzzle.updateMany({
      where: {
        dataSource,
        externalCardId: batchIds[i]!,
        savedAt: null,
      },
      data: {
        savedAt,
        fabSet: resolved[i] ?? null,
      },
    });
    count += res.count;
  }
  return count;
}

/**
 * Loads all cards for the datasource + filters (same contract as `POST /api/datasources/load`),
 * then for each unique card id:
 * - **No puzzle** → create puzzle + steps with **`savedAt` set**.
 * - **Puzzle in draft** (`savedAt` null) → set **`savedAt`** (no seed/steps change).
 * - **Already saved** → skip.
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
            ]),
          )
        : {};

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid sourceId" },
        { status: 400 },
      );
    }

    const plugin = dataSources.find((d) => d.id === sourceId);
    if (!plugin) {
      return NextResponse.json(
        { error: `Unknown data source: ${sourceId}` },
        { status: 404 },
      );
    }

    const filterError = await validateLoadFilters(plugin, filters);
    if (filterError) {
      return NextResponse.json({ error: filterError }, { status: 400 });
    }

    const cards = await plugin.loadCards(filters);
    const dataSource = plugin.id;

    const uniqueById = new Map<string, CardDTO>();
    for (const c of cards) {
      if (!uniqueById.has(c.id)) uniqueById.set(c.id, c);
    }
    const uniqueCards = [...uniqueById.values()];
    const uniqueIds = uniqueCards.map((c) => c.id);
    const cardById = new Map(uniqueCards.map((c) => [c.id, c]));

    const existingRows = await prisma.puzzle.findMany({
      where: {
        dataSource,
        externalCardId: { in: uniqueIds },
      },
      select: { externalCardId: true, savedAt: true },
    });

    const draftExternalIds = existingRows
      .filter((r) => r.savedAt == null)
      .map((r) => r.externalCardId);
    const alreadySavedCount = existingRows.filter((r) => r.savedAt != null).length;
    const existingSet = new Set(existingRows.map((r) => r.externalCardId));
    const toCreate = uniqueCards.filter((c) => !existingSet.has(c.id));

    let created = 0;
    let draftsSaved = 0;
    const errors: BulkError[] = [];
    const savedAt = new Date();

    for (let i = 0; i < draftExternalIds.length; i += BATCH_SIZE) {
      const batchIds = draftExternalIds.slice(i, i + BATCH_SIZE);
      try {
        const n = await updateDraftPuzzlesBatch(
          batchIds,
          cardById,
          dataSource,
          filters,
          savedAt,
        );
        draftsSaved += n;
      } catch (e) {
        errors.push({
          externalCardId: batchIds[0] ?? "batch",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);
      for (const card of batch) {
        const seed = randomUUID();
        const stepValues = generateSteps(seed);

        try {
          await prisma.puzzle.create({
            data: {
              dataSource,
              fabSet: resolveFabSet(dataSource, filters, card),
              externalCardId: card.id,
              cardName: card.name,
              imageUrl: card.imageUrl,
              seed,
              savedAt,
              steps: {
                create: stepValues.map((s) => ({
                  step: s.step,
                  blur: s.blur,
                  brightness: s.brightness,
                })),
              },
            },
          });
          created += 1;
        } catch (e) {
          if (isPrismaUniqueViolation(e)) {
            /* raced: row may exist now — try draft save only */
            try {
              const u = await prisma.puzzle.updateMany({
                where: {
                  dataSource,
                  externalCardId: card.id,
                  savedAt: null,
                },
                data: {
                  savedAt,
                  fabSet: resolveFabSet(dataSource, filters, card),
                },
              });
              draftsSaved += u.count;
            } catch {
              /* ignore */
            }
            continue;
          }
          errors.push({
            externalCardId: card.id,
            message: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      dataSource,
      totalCards: cards.length,
      uniqueCards: uniqueCards.length,
      created,
      draftsSaved,
      alreadySaved: alreadySavedCount,
      batchSize: BATCH_SIZE,
      errors,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
