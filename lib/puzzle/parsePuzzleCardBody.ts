export type PuzzleCardInput = {
  dataSource: string;
  /** FAB set from the card / datasource (`card.setLabel`); body `fabSet` is fallback only. */
  fabSet: string | null;
  card: { id: string; name: string; imageUrl: string };
};

export type ParsePuzzleBodyError = { error: string; status: number };

export type ParsePuzzleBodyResult = PuzzleCardInput | ParsePuzzleBodyError;

export function parsePuzzleCardBody(body: unknown): ParsePuzzleBodyResult {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body", status: 400 };
  }

  const b = body as {
    dataSource?: string;
    fabSet?: string;
    card?: {
      id?: string;
      name?: string;
      imageUrl?: string;
      setLabel?: string;
    };
  };

  const dataSource =
    typeof b.dataSource === "string" ? b.dataSource.trim() : "";
  if (!dataSource) {
    return { error: "Missing or invalid dataSource", status: 400 };
  }

  const card = b.card;
  if (!card || typeof card !== "object") {
    return { error: "Missing or invalid card", status: 400 };
  }

  const id = typeof card.id === "string" ? card.id.trim() : "";
  const name = typeof card.name === "string" ? card.name.trim() : "";
  const imageUrl =
    typeof card.imageUrl === "string" ? card.imageUrl.trim() : "";

  if (!id || !name || !imageUrl) {
    return {
      error: "card.id, card.name, and card.imageUrl are required",
      status: 400,
    };
  }

  const fromCard =
    typeof card.setLabel === "string" ? card.setLabel.trim() : "";
  const fromRoot = typeof b.fabSet === "string" ? b.fabSet.trim() : "";
  const fabSetJoined = fromCard || fromRoot;
  const fabSet = fabSetJoined.length > 0 ? fabSetJoined : null;

  return { dataSource, fabSet, card: { id, name, imageUrl } };
}
