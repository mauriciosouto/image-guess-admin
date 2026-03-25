import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { puzzleId?: string };
    const puzzleId =
      typeof body.puzzleId === "string" ? body.puzzleId.trim() : "";

    if (!puzzleId) {
      return NextResponse.json(
        { error: "Missing or invalid puzzleId" },
        { status: 400 },
      );
    }

    const puzzle = await prisma.puzzle.update({
      where: { id: puzzleId },
      data: { savedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      puzzleId: puzzle.id,
      savedAt: puzzle.savedAt?.toISOString() ?? null,
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
