/**
 * Value to store on `Puzzle.fabSet`. Comes from the **card as produced by the datasource**
 * (`CardDTO.setLabel` — e.g. FAB’s active set when the card was loaded). The load **filter**
 * `set` is only a fallback for FAB when `setLabel` is missing.
 */
export function resolveFabSet(
  dataSource: string,
  filters: Record<string, string>,
  card?: { setLabel?: string | null },
): string | null {
  const raw = card?.setLabel;
  const fromCard = typeof raw === "string" ? raw.trim() : "";
  if (fromCard.length > 0) {
    return fromCard;
  }
  if (dataSource === "fab") {
    const fromFilter = filters.set?.trim();
    if (fromFilter) return fromFilter;
  }
  return null;
}
