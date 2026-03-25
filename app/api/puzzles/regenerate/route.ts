import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { generateSteps } from "@/lib/puzzle/generateSteps";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { puzzleId?: string };
    const puzzleId =
      typeof body.puzzleId === "string" ? body.puzzleId.trim() : "";

    if (!puzzleId) {
      return NextResponse.json(
        { error: "Missing or invalid puzzleId" },
        { status: 400 }
      );
    }

    const seed = randomUUID();
    const stepValues = generateSteps(seed);

    await prisma.$transaction(async (tx) => {
      await tx.puzzleStep.deleteMany({ where: { puzzleId } });
      await tx.puzzle.update({
        where: { id: puzzleId },
        data: { seed, savedAt: null },
      });
      await tx.puzzleStep.createMany({
        data: stepValues.map((s) => ({
          puzzleId,
          step: s.step,
          blur: s.blur,
          brightness: s.brightness,
        })),
      });
    });

    const puzzle = await prisma.puzzle.findUniqueOrThrow({
      where: { id: puzzleId },
      include: { steps: { orderBy: { step: "asc" } } },
    });

    return NextResponse.json({
      puzzleId: puzzle.id,
      seed: puzzle.seed,
      cardName: puzzle.cardName,
      imageUrl: puzzle.imageUrl,
      savedAt: puzzle.savedAt,
      steps: puzzle.steps.map((s) => ({
        step: s.step,
        blur: s.blur,
        brightness: s.brightness,
      })),
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code: string }).code
        : "";
    if (code === "P2025") {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
