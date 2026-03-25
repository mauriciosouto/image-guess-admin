"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  puzzleId: string;
};

export function PuzzleActions({ puzzleId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"regen" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setError(null);
    setBusy("regen");
    try {
      const res = await fetch("/api/puzzles/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Regenerate failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this puzzle and all its steps?")) return;
    setError(null);
    setBusy("delete");
    try {
      const res = await fetch("/api/puzzles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Full regenerate replaces the seed, clears per-step variants, and removes
        saved status.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleRegenerate()}
          disabled={busy !== null}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {busy === "regen" ? "Regenerating…" : "Regenerate entire puzzle"}
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy !== null}
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950"
        >
          {busy === "delete" ? "Deleting…" : "Delete Puzzle"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
