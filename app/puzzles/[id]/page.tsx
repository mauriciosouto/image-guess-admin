import Link from "next/link";
import { notFound } from "next/navigation";

import { PUZZLE_STEP_COUNT } from "@/lib/puzzle/deterministicStep";
import { generateRegions } from "@/lib/puzzle/generateRegions";
import { prisma } from "@/lib/prisma";

import { PuzzleActions } from "./puzzle-actions";
import { PuzzleOriginalImage } from "./puzzle-original-image";
import { PuzzleSaveBar } from "./puzzle-save-bar";
import { PuzzleStepTile } from "./puzzle-step-tile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PuzzleDetailPage({ params }: PageProps) {
  const { id } = await params;

  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: { steps: { orderBy: { step: "asc" } } },
  });

  if (!puzzle) {
    notFound();
  }

  const steps = puzzle.steps;

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Back to cards
          </Link>
        </p>

        <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {puzzle.cardName}
          </h1>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="inline text-zinc-500 dark:text-zinc-400">
                Data source:{" "}
              </dt>
              <dd className="inline font-mono text-zinc-800 dark:text-zinc-200">
                {puzzle.dataSource}
              </dd>
            </div>
            {puzzle.fabSet ? (
              <div>
                <dt className="inline text-zinc-500 dark:text-zinc-400">
                  FAB set:{" "}
                </dt>
                <dd className="inline font-mono text-zinc-800 dark:text-zinc-200">
                  {puzzle.fabSet}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="inline text-zinc-500 dark:text-zinc-400">
                Seed:{" "}
              </dt>
              <dd className="inline break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {puzzle.seed}
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500 dark:text-zinc-400">
                Puzzle ID:{" "}
              </dt>
              <dd className="inline break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {puzzle.id}
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500 dark:text-zinc-400">
                Status:{" "}
              </dt>
              <dd className="inline text-xs text-zinc-800 dark:text-zinc-200">
                {puzzle.savedAt ? (
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Saved
                  </span>
                ) : (
                  <span className="text-amber-800 dark:text-amber-200">
                    Draft
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Original image</h2>
          <div className="mt-3 flex justify-center sm:justify-start">
            <PuzzleOriginalImage src={puzzle.imageUrl} alt={puzzle.cardName} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Steps (region obfuscation)</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Full image always shown; overlays only. Name, type, and card info are
            always blacked. There are {PUZZLE_STEP_COUNT} steps; each preview is
            recomputed from the puzzle seed and step number only (deterministic 4×4
            cell shuffle + scripted reveal).
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {steps.map((s) => (
              <PuzzleStepTile
                key={s.step}
                step={s.step}
                imageUrl={puzzle.imageUrl}
                alt={puzzle.cardName}
                regions={generateRegions(puzzle.seed, s.step)}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">Save</h2>
          <div className="mt-3">
            <PuzzleSaveBar
              puzzleId={puzzle.id}
              initiallySaved={puzzle.savedAt != null}
            />
          </div>
        </section>

        <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Actions</h2>
          <div className="mt-3">
            <PuzzleActions puzzleId={puzzle.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
