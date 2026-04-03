import { cards } from "@flesh-and-blood/cards";
import type { Card } from "@flesh-and-blood/types";

import type { CardDTO, DataSourcePlugin, LoadFilterField } from "./types";

const PLACEHOLDER = "https://via.placeholder.com/300";

let sampleCardLogged = false;

function logSampleCardOnce(card: Card) {
  if (sampleCardLogged || process.env.NODE_ENV === "production") return;
  sampleCardLogged = true;
  try {
    console.log("[fab] sample card JSON:\n", JSON.stringify(card, null, 2));
  } catch {
    console.log("[fab] sample card (non-serializable), fields:", {
      cardIdentifier: card.cardIdentifier,
      name: card.name,
      defaultImage: card.defaultImage,
      printings0: card.printings?.[0],
    });
  }
}

/** Strip suffixes like `.width-450` sometimes seen in FAB data. */
function normalizeFabProductCode(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const code = raw.replace(/\.width-\d+$/i, "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
  return code;
}

/**
 * Fabrary CDN uses printing-style codes (e.g. WTR001) from `defaultImage` / `printings[].identifier`.
 * When a set filter is active, prefer a printing from that set.
 */
function extractCardCode(card: Card, setLabel: string): string | null {
  for (const p of card.printings ?? []) {
    if (String(p.set) === setLabel) {
      const fromId = normalizeFabProductCode(p.identifier);
      if (fromId) return fromId;
      const fromImg = normalizeFabProductCode(p.image);
      if (fromImg) return fromImg;
    }
  }

  const fromDefault = normalizeFabProductCode(card.defaultImage);
  if (fromDefault) return fromDefault;

  for (const p of card.printings ?? []) {
    const fromId = normalizeFabProductCode(p.identifier);
    if (fromId) return fromId;
    const fromImg = normalizeFabProductCode(p.image);
    if (fromImg) return fromImg;
  }

  return normalizeFabProductCode(card.specialImage);
}

function buildFabraryImageUrl(cardCode: string): string {
  return `https://content.fabrary.net/cards/${cardCode}.webp`;
}

function toCardDTO(card: Card, setLabel: string): CardDTO {
  logSampleCardOnce(card);

  const cardCode = extractCardCode(card, setLabel);
  const id = cardCode ?? card.cardIdentifier;
  const imageUrl = cardCode
    ? buildFabraryImageUrl(cardCode)
    : PLACEHOLDER;

  return {
    id,
    name: card.name,
    imageUrl,
    /** Same as the active `set` filter for this load — each card’s edition for persistence (`Puzzle.fabSet`). */
    setLabel,
  };
}

/**
 * Red / yellow / blue pitch variants share the same display name — one row per name.
 * Prefers lower pitch (typically red) when present; tie-break on cardIdentifier.
 */
function pickRepresentativeFabCard(variants: Card[]): Card {
  return [...variants].sort((a, b) => {
    const pa = a.pitch ?? 999;
    const pb = b.pitch ?? 999;
    if (pa !== pb) return pa - pb;
    return a.cardIdentifier.localeCompare(b.cardIdentifier);
  })[0];
}

function dedupeFabCardsByDisplayName(list: Card[]): Card[] {
  const byName = new Map<string, Card[]>();
  for (const card of list) {
    const key = card.name.trim();
    const bucket = byName.get(key);
    if (bucket) bucket.push(card);
    else byName.set(key, [card]);
  }
  return Array.from(byName.values()).map(pickRepresentativeFabCard);
}

const fabSetSelectOptions = (() => {
  const seen = new Set<string>();
  for (const card of cards) {
    for (const set of card.sets ?? []) {
      seen.add(String(set));
    }
  }
  return Array.from(seen)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((value) => ({ value, label: value }));
})();

export const fabDataSource: DataSourcePlugin = {
  id: "fab",
  name: "Flesh and Blood",
  describeLoadFilters(): LoadFilterField[] {
    return [
      {
        kind: "select",
        id: "set",
        label: "Set",
        description:
          "Only cards in this set. Pitch variants (same name, different red/yellow/blue) are shown once — we pick one variant (prefer red).",
        required: true,
        options: fabSetSelectOptions,
      },
    ];
  },
  async loadCards(filters) {
    const setId = filters.set?.trim();
    if (!setId) {
      throw new Error("Choose a Flesh and Blood set to load.");
    }

    const inSet = cards.filter((c) =>
      (c.sets ?? []).some((s) => String(s) === setId)
    );
    const uniqueByName = dedupeFabCardsByDisplayName(inSet);
    return uniqueByName.map((c) => toCardDTO(c, setId));
  },
};
