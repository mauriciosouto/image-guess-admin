"use client";

const BROKEN = "https://via.placeholder.com/300?text=FAB+Card";

type Props = {
  src: string;
  alt: string;
};

export function PuzzleOriginalImage({ src, alt }: Props) {
  return (
    <div className="h-72 w-full max-w-xs overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top"
        onError={(e) => {
          const t = e.currentTarget;
          if (t.dataset.fallback === "1") return;
          t.dataset.fallback = "1";
          t.src = BROKEN;
        }}
      />
    </div>
  );
}
