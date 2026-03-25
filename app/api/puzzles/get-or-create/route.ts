import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { generateSteps } from "@/lib/puzzle/generateSteps";
import { isPrismaUniqueViolation } from "@/lib/puzzle/isPrismaUniqueViolation";
import { parsePuzzleCardBody } from "@/lib/puzzle/parsePuzzleCardBody";
import { prisma } from "@/lib/prisma";

function puzzleResponse(puzzle: {
  id: string;
  seed: string;
  cardName: string;
  imageUrl: string;
  savedAt: Date | null;
  steps: { step: number; blur: number; brightness: number }[];
}) {
  return {
    puzzleId: puzzle.id,
    seed: puzzle.seed,
    cardName: puzzle.cardName,
    imageUrl: puzzle.imageUrl,
    savedAt: puzzle.savedAt?.toISOString() ?? null,
    steps: puzzle.steps.map((s) => ({
      step: s.step,
      blur: s.blur,
      brightness: s.brightness,
    })),
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = parsePuzzleCardBody(raw);
    if ("error" in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status }
      );
    }

    const { dataSource, card } = parsed;

    // Use findFirst (not compound findUnique) so a stale generated client still works
    // after schema adds @@unique; DB unique still enforces one row per pair when applied.
    const existing = await prisma.puzzle.findFirst({
      where: {
        dataSource,
        externalCardId: card.id,
      },
      include: {
        steps: { orderBy: { step: "asc" } },
      },
    });

    if (existing) {
      return NextResponse.json(puzzleResponse(existing));
    }

    const seed = randomUUID();
    const stepValues = generateSteps(seed);

    try {
      const created = await prisma.puzzle.create({
        data: {
          dataSource,
          externalCardId: card.id,
          cardName: card.name,
          imageUrl: card.imageUrl,
          seed,
          steps: {
            create: stepValues.map((s) => ({
              step: s.step,
              blur: s.blur,
              brightness: s.brightness,
            })),
          },
        },
        include: {
          steps: { orderBy: { step: "asc" } },
        },
      });
      return NextResponse.json(puzzleResponse(created));
    } catch (e) {
      if (isPrismaUniqueViolation(e)) {
        const raced = await prisma.puzzle.findFirst({
          where: {
            dataSource,
            externalCardId: card.id,
          },
          include: {
            steps: { orderBy: { step: "asc" } },
          },
        });
        if (raced) {
          return NextResponse.json(puzzleResponse(raced));
        }
      }
      throw e;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
