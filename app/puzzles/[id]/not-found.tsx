import Link from "next/link";

export default function PuzzleNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-zinc-50 px-4 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <h1 className="text-xl font-semibold">Puzzle not found</h1>
      <Link
        href="/"
        className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to cards
      </Link>
    </div>
  );
}
