"use client";

import type { Effect } from "@/lib/puzzle/effects/types";
import type { Region } from "@/lib/puzzle/regionTypes";

const BROKEN = "https://via.placeholder.com/300?text=FAB+Card";

type Props = {
  imageUrl: string;
  alt: string;
  step: number;
  /** Precomputed on the server so SSR and hydration match exactly. */
  regions: Region[];
};

function buildFilterString(effects: Effect[]): string | undefined {
  const parts: string[] = [];
  for (const e of effects) {
    if (e.type === "blur") {
      const px = Math.round(((e.intensity ?? 4) + Number.EPSILON) * 100) / 100;
      parts.push(`blur(${px}px)`);
    } else if (e.type === "brightness") {
      const v =
        Math.round(((e.intensity ?? 1) + Number.EPSILON) * 1000) / 1000;
      parts.push(`brightness(${v})`);
    } else if (e.type === "invert") {
      const v =
        Math.round(((e.intensity ?? 1) + Number.EPSILON) * 1000) / 1000;
      parts.push(`invert(${v})`);
    }
  }
  return parts.length ? parts.join(" ") : undefined;
}

function RegionOverlay({
  region,
  imageUrl,
}: {
  region: Region;
  imageUrl: string;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    zIndex: region.zIndex ?? 1,
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
    pointerEvents: "none",
  };

  if (region.effects.some((e) => e.type === "blackout")) {
    return <div style={{ ...base, backgroundColor: "#000" }} />;
  }

  const rotateEff = region.effects.find((e) => e.type === "rotate");
  const rotateDeg = rotateEff?.intensity;
  const hasPixelate = region.effects.some((e) => e.type === "pixelate");
  const filter = buildFilterString(region.effects);

  const w = region.width;
  const h = region.height;
  const x = region.x;
  const y = region.y;
  if (w <= 0 || h <= 0) {
    return null;
  }

  const wrapperStyle: React.CSSProperties = {
    ...base,
    overflow: "hidden",
  };
  if (rotateDeg != null) {
    wrapperStyle.transform = `rotate(${rotateDeg}deg)`;
    wrapperStyle.transformOrigin = "center center";
  }

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    width: `${(100 / w) * 100}%`,
    height: `${(100 / h) * 100}%`,
    left: `${(-x / w) * 100}%`,
    top: `${(-y / h) * 100}%`,
    objectFit: "cover",
    objectPosition: "top center",
  };
  if (filter) {
    imgStyle.filter = filter;
  }
  if (hasPixelate) {
    imgStyle.imageRendering = "pixelated";
    imgStyle.transform = "scale(1.1)";
  }

  return (
    <div style={wrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="max-w-none select-none"
        draggable={false}
        style={imgStyle}
      />
    </div>
  );
}

export function PuzzleStepTile({
  imageUrl,
  alt,
  step,
  regions,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Step {step}
      </p>
      <div className="relative aspect-[5/7] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        {/* Full card always painted; zones are overlays only (never replace the image). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 z-0 h-full w-full object-cover object-top"
          loading="lazy"
          onError={(e) => {
            const t = e.currentTarget;
            if (t.dataset.fallback === "1") return;
            t.dataset.fallback = "1";
            t.src = BROKEN;
          }}
        />
        {regions.map((r) => (
          <RegionOverlay key={r.id} region={r} imageUrl={imageUrl} />
        ))}
      </div>
      <p className="text-center font-mono text-[10px] text-zinc-400">
        {regions.length} overlay{regions.length === 1 ? "" : "s"} (FAB zones)
      </p>
    </div>
  );
}
