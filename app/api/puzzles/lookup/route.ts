import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      dataSource?: string;
      externalCardIds?: string[];
    };
    const dataSource =
      typeof body.dataSource === "string" ? body.dataSource.trim() : "";
    const ids = Array.isArray(body.externalCardIds)
      ? body.externalCardIds.filter((x) => typeof x === "string")
      : [];

    if (!dataSource || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing dataSource or externalCardIds" },
        { status: 400 },
      );
    }

    const unique = [...new Set(ids)].slice(0, 500);

    const rows = await prisma.puzzle.findMany({
      where: {
        dataSource,
        externalCardId: { in: unique },
      },
      select: {
        id: true,
        externalCardId: true,
        savedAt: true,
      },
    });

    const cards: Record<
      string,
      { puzzleId: string; saved: boolean } | null
    > = {};
    for (const id of unique) {
      cards[id] = null;
    }
    for (const r of rows) {
      cards[r.externalCardId] = {
        puzzleId: r.id,
        saved: r.savedAt != null,
      };
    }

    return NextResponse.json({ cards });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
