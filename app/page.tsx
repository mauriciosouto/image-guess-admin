"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LoadFilterSelect = {
  kind: "select";
  id: string;
  label: string;
  description?: string;
  required: boolean;
  options: Array<{ value: string; label: string }>;
};

type DataSourceInfo = {
  id: string;
  name: string;
  loadFilters: LoadFilterSelect[];
};

type CardRow = {
  id: string;
  dataSourceId: string;
  name: string;
  imageUrl: string;
  setLabel?: string | null;
};

type CardPuzzleLookup = { puzzleId: string; saved: boolean };

const BROKEN_IMAGE_PLACEHOLDER =
  "https://via.placeholder.com/300?text=FAB+Card";

const HOME_PREVIEW_STORAGE_KEY = "image-guess-admin:home-preview";

type PersistedHomeSnapshot = {
  v: 1;
  selectedSourceId: string;
  filterValues: Record<string, string>;
  previewCards: CardRow[];
  loadMessage: string | null;
};

function emptyFiltersForSource(
  src: DataSourceInfo | undefined
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const f of src?.loadFilters ?? []) {
    next[f.id] = "";
  }
  return next;
}

function readHomeSnapshot(): PersistedHomeSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HOME_PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedHomeSnapshot;
    if (p.v !== 1 || typeof p.selectedSourceId !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

function writeHomeSnapshot(snapshot: PersistedHomeSnapshot) {
  try {
    sessionStorage.setItem(HOME_PREVIEW_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
}

function clearHomeSnapshot() {
  try {
    sessionStorage.removeItem(HOME_PREVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export default function Home() {
  const router = useRouter();
  const [sources, setSources] = useState<DataSourceInfo[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [previewCards, setPreviewCards] = useState<CardRow[]>([]);

  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [loadLoading, setLoadLoading] = useState(false);

  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const [openingPuzzleKey, setOpeningPuzzleKey] = useState<string | null>(null);
  const [puzzleOpenError, setPuzzleOpenError] = useState<string | null>(null);
  const [cardLookup, setCardLookup] = useState<
    Record<string, CardPuzzleLookup | null>
  >({});

  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{
    totalCards: number;
    uniqueCards?: number;
    created: number;
    draftsSaved: number;
    alreadySaved: number;
    errors: Array<{ externalCardId: string; message: string }>;
  } | null>(null);

  const restoreAttemptedRef = useRef(false);

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId),
    [sources, selectedSourceId]
  );

  const loadFiltersReady = useMemo(() => {
    const fields = selectedSource?.loadFilters ?? [];
    for (const field of fields) {
      if (field.required && !filterValues[field.id]?.trim()) {
        return false;
      }
    }
    return true;
  }, [selectedSource, filterValues]);

  const fetchSources = useCallback(async () => {
    setSourcesError(null);
    setSourcesLoading(true);
    try {
      const res = await fetch("/api/datasources");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load data sources");
      }
      const list = data.dataSources as DataSourceInfo[];
      setSources(list);
      setSelectedSourceId((prev) =>
        prev && list.some((s) => s.id === prev)
          ? prev
          : list[0]?.id ?? ""
      );
    } catch (e) {
      setSourcesError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    if (!selectedSourceId || previewCards.length === 0) {
      setCardLookup({});
      return;
    }
    const ac = new AbortController();
    const externalCardIds = previewCards.map((c) => c.id);
    void (async () => {
      try {
        const res = await fetch("/api/puzzles/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataSource: selectedSourceId, externalCardIds }),
          signal: ac.signal,
        });
        const data = (await res.json()) as {
          cards?: Record<string, CardPuzzleLookup | null>;
        };
        if (!res.ok) {
          return;
        }
        setCardLookup(data.cards ?? {});
      } catch {
        /* aborted */
      }
    })();
    return () => ac.abort();
  }, [selectedSourceId, previewCards]);

  useEffect(() => {
    if (sourcesLoading || sources.length === 0 || restoreAttemptedRef.current) {
      return;
    }
    restoreAttemptedRef.current = true;

    const saved = readHomeSnapshot();
    if (
      saved &&
      sources.some((s) => s.id === saved.selectedSourceId) &&
      saved.previewCards.length > 0
    ) {
      setSelectedSourceId(saved.selectedSourceId);
      setFilterValues(saved.filterValues);
      setPreviewCards(saved.previewCards);
      setLoadMessage(saved.loadMessage);
      return;
    }

    const id =
      saved && sources.some((s) => s.id === saved.selectedSourceId)
        ? saved.selectedSourceId
        : sources[0]?.id ?? "";
    setSelectedSourceId(id);
    setFilterValues(emptyFiltersForSource(sources.find((s) => s.id === id)));
  }, [sourcesLoading, sources]);

  async function handleLoadCards() {
    if (!selectedSourceId || !loadFiltersReady) return;
    setLoadError(null);
    setLoadMessage(null);
    setLoadLoading(true);
    try {
      const res = await fetch("/api/datasources/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          filters: filterValues,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Load failed");
      }
      const cards = data.cards as CardRow[];
      const msg = `Showing ${data.count as number} card${
        data.count === 1 ? "" : "s"
      } (preview — not saved). Open a card to load or create its puzzle.`;
      setPreviewCards(cards);
      setLoadMessage(msg);
      writeHomeSnapshot({
        v: 1,
        selectedSourceId,
        filterValues,
        previewCards: cards,
        loadMessage: msg,
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoadLoading(false);
    }
  }

  async function refreshCardLookupForPreview() {
    if (!selectedSourceId || previewCards.length === 0) return;
    const externalCardIds = previewCards.map((c) => c.id);
    try {
      const res = await fetch("/api/puzzles/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataSource: selectedSourceId, externalCardIds }),
      });
      const data = (await res.json()) as {
        cards?: Record<string, CardPuzzleLookup | null>;
      };
      if (res.ok) {
        setCardLookup(data.cards ?? {});
      }
    } catch {
      /* ignore */
    }
  }

  async function handleBulkGeneratePuzzles() {
    if (!selectedSourceId || !loadFiltersReady) return;
    setBulkError(null);
    setBulkResult(null);
    setBulkLoading(true);
    try {
      const res = await fetch("/api/puzzles/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          filters: filterValues,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        totalCards?: number;
        uniqueCards?: number;
        created?: number;
        draftsSaved?: number;
        alreadySaved?: number;
        errors?: Array<{ externalCardId: string; message: string }>;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Bulk generate failed");
      }
      if (
        data.totalCards == null ||
        data.created == null ||
        data.draftsSaved == null ||
        data.alreadySaved == null
      ) {
        throw new Error("Invalid response from server");
      }
      setBulkResult({
        totalCards: data.totalCards,
        uniqueCards: data.uniqueCards,
        created: data.created,
        draftsSaved: data.draftsSaved,
        alreadySaved: data.alreadySaved,
        errors: data.errors ?? [],
      });
      await refreshCardLookupForPreview();
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleOpenPuzzle(card: CardRow) {
    if (selectedSourceId && previewCards.length > 0) {
      writeHomeSnapshot({
        v: 1,
        selectedSourceId,
        filterValues,
        previewCards,
        loadMessage,
      });
    }
    const key = `${card.dataSourceId}:${card.id}`;
    setOpeningPuzzleKey(key);
    setPuzzleOpenError(null);
    try {
      const res = await fetch("/api/puzzles/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSource: card.dataSourceId,
          card: {
            id: card.id,
            name: card.name,
            imageUrl: card.imageUrl,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to open puzzle");
      }
      router.push(`/puzzles/${data.puzzleId as string}`);
    } catch (e) {
      setPuzzleOpenError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setOpeningPuzzleKey(null);
    }
  }

  function handlePuzzleCta(card: CardRow) {
    const info = cardLookup[card.id];
    if (info?.saved && info.puzzleId) {
      router.push(`/puzzles/${info.puzzleId}`);
      return;
    }
    void handleOpenPuzzle(card);
  }

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Image Guess Admin
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Preview cards from datasources, then open a puzzle (get or create) to
            see region-based step previews (blur / pixel / blackout).
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Data source</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Choose a source, set filters, then load a preview in the grid below.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="source"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                Source
              </label>
              <select
                id="source"
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:ring-zinc-600"
                value={selectedSourceId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  const src = sources.find((s) => s.id === nextId);
                  clearHomeSnapshot();
                  setSelectedSourceId(nextId);
                  setFilterValues(emptyFiltersForSource(src));
                  setPreviewCards([]);
                  setLoadMessage(null);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                disabled={sourcesLoading || sources.length === 0}
              >
                {sources.length === 0 && !sourcesLoading ? (
                  <option value="">No sources</option>
                ) : (
                  sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void handleLoadCards()}
                disabled={
                  loadLoading ||
                  !selectedSourceId ||
                  !loadFiltersReady ||
                  sourcesLoading ||
                  !!sourcesError
                }
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {loadLoading ? "Loading…" : "Load cards"}
              </button>
              <button
                type="button"
                onClick={() => void handleBulkGeneratePuzzles()}
                disabled={
                  bulkLoading ||
                  !selectedSourceId ||
                  !loadFiltersReady ||
                  sourcesLoading ||
                  !!sourcesError
                }
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {bulkLoading ? "Saving puzzles…" : "Create all puzzles (DB)"}
              </button>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-xs text-zinc-500 dark:text-zinc-400">
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">
              Create all puzzles (DB)
            </strong>{" "}
            loads every card for the current source + filters on the server, then
            creates missing puzzles in batches of 30 (each new row is saved), and sets{" "}
            <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">savedAt</code>{" "}
            on any <strong className="text-zinc-600 dark:text-zinc-300">draft</strong>{" "}
            puzzle that already existed. Already-saved puzzles are left as-is.
          </p>

          {selectedSource && selectedSource.loadFilters.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Source filters
              </p>
              {selectedSource.loadFilters.map((field) => {
                if (field.kind !== "select") return null;
                return (
                  <div key={field.id}>
                    <label
                      htmlFor={`filter-${field.id}`}
                      className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
                      {field.label}
                      {field.required ? (
                        <span className="text-red-600 dark:text-red-400"> *</span>
                      ) : null}
                    </label>
                    <select
                      id={`filter-${field.id}`}
                      className="mt-2 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:ring-zinc-600"
                      value={filterValues[field.id] ?? ""}
                      onChange={(e) => {
                        clearHomeSnapshot();
                        setFilterValues((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }));
                        setPreviewCards([]);
                        setLoadMessage(null);
                        setBulkResult(null);
                        setBulkError(null);
                      }}
                      disabled={sourcesLoading}
                    >
                      <option value="">
                        {field.required ? "Choose…" : "Any"}
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {field.description ? (
                      <p className="mt-1.5 max-w-xl text-xs text-zinc-500 dark:text-zinc-400">
                        {field.description}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {sourcesLoading && (
            <p className="mt-4 text-sm text-zinc-500">Loading sources…</p>
          )}
          {sourcesError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {sourcesError}
            </p>
          )}
          {loadError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {loadError}
            </p>
          )}
          {loadMessage && (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              {loadMessage}
            </p>
          )}
          {bulkError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {bulkError}
            </p>
          )}
          {bulkResult && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <p className="font-medium">Bulk create finished</p>
              <p className="mt-1 text-emerald-800 dark:text-emerald-200">
                Cards loaded: {bulkResult.totalCards}
                {bulkResult.uniqueCards != null &&
                bulkResult.uniqueCards !== bulkResult.totalCards
                  ? ` (${bulkResult.uniqueCards} unique ids)`
                  : ""}
                . New puzzles: <strong>{bulkResult.created}</strong>. Drafts saved:{" "}
                <strong>{bulkResult.draftsSaved}</strong>. Already saved (unchanged):{" "}
                <strong>{bulkResult.alreadySaved}</strong>.
              </p>
              {bulkResult.errors.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-xs text-red-700 dark:text-red-300">
                  {bulkResult.errors.slice(0, 8).map((err) => (
                    <li key={err.externalCardId}>
                      {err.externalCardId}: {err.message}
                    </li>
                  ))}
                  {bulkResult.errors.length > 8 ? (
                    <li>…and {bulkResult.errors.length - 8} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-medium">Preview</h2>
            {loadLoading ? (
              <p className="text-sm text-zinc-500">Loading preview…</p>
            ) : (
              <p className="text-sm text-zinc-500">
                {previewCards.length} card
                {previewCards.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {puzzleOpenError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {puzzleOpenError}
            </p>
          )}

          {!loadLoading && previewCards.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
              No preview yet. Choose filters and click &quot;Load cards&quot;.
            </p>
          )}

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {previewCards.map((card) => {
              const info = cardLookup[card.id];
              const rowKey = `${card.dataSourceId}:${card.id}`;
              const opening = openingPuzzleKey === rowKey;
              const ctaSaved = info?.saved === true;
              return (
                <li
                  key={rowKey}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-zinc-100 dark:bg-zinc-800">
                    {ctaSaved ? (
                      <div
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white dark:ring-zinc-900"
                        title="Puzzle saved"
                        aria-hidden
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.dataset.fallbackApplied === "1") return;
                        target.dataset.fallbackApplied = "1";
                        target.src = BROKEN_IMAGE_PLACEHOLDER;
                      }}
                    />
                  </div>
                  <p className="line-clamp-2 px-3 py-2 text-xs font-medium leading-snug sm:text-sm">
                    {card.name}
                  </p>
                  <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handlePuzzleCta(card)}
                      disabled={opening}
                      className="w-full rounded-md bg-zinc-100 px-2 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      {opening
                        ? "Opening…"
                        : ctaSaved
                          ? "View puzzle"
                          : "Generate puzzle"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
