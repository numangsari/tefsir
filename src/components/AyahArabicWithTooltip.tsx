"use client";

import type { WordItem } from "@/components/AyahWordBridge";

export function AyahArabicWithTooltip({
  surahId,
  ayahNo,
  arabic,
  compact,
  words,
  activeIndex,
  onHoverIndex,
}: {
  surahId: number;
  ayahNo: number;
  arabic: string;
  compact: boolean;
  words?: WordItem[] | null;
  activeIndex?: number | null;
  onHoverIndex?: (index: number | null) => void;
}) {
  void surahId;
  void ayahNo;

  if (!words || words.length === 0) {
    return <div className="arabic">{arabic}</div>;
  }

  return (
    <div className={`arabic ${compact ? "text-[1.25rem] leading-[2rem]" : ""}`}>
      {words.map((w) => {
        const active = activeIndex === w.index;
        const showTip = active && w.tr;
        return (
          <span
            key={`${w.index}-${w.arabic}`}
            data-word-index={w.index}
            onMouseEnter={() => onHoverIndex?.(w.index)}
            className={`relative inline-block mx-[2px] px-0.5 rounded transition-colors cursor-default ${
              active
                ? "bg-emerald-200 dark:bg-emerald-800/70 text-emerald-950 dark:text-emerald-50 ring-1 ring-emerald-500"
                : "hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
            }`}
          >
            {w.arabic}
            {showTip && (
              <span
                role="tooltip"
                className="absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2.5 py-1 text-xs font-sans text-white shadow-lg dark:bg-stone-700 pointer-events-none"
              >
                {w.tr}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-stone-800 dark:border-t-stone-700" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
