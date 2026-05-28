"use client";

import { useEffect, useState } from "react";
import { AyahArabicWithTooltip } from "@/components/AyahArabicWithTooltip";
import { MealSwitcher } from "@/components/MealSwitcher";
import {
  arabicWordsFromPlainText,
  buildAlignedWords,
  type AlignedWord,
} from "@/lib/ayah-word-align";

export type WordItem = AlignedWord;

export function AyahWordBridge({
  surahId,
  ayahNo,
  arabic,
  meal,
  compact,
}: {
  surahId: number;
  ayahNo: number;
  arabic: string;
  meal: string;
  compact: boolean;
}) {
  const [words, setWords] = useState<WordItem[] | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    function applyFallback() {
      const list = arabicWordsFromPlainText(arabic);
      if (list.length > 0) {
        setWords(buildAlignedWords(list, meal));
      }
    }

    (async () => {
      try {
        const r = await fetch(`/api/word-translation/${surahId}/${ayahNo}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          if (!cancelled) applyFallback();
          return;
        }
        const d = (await r.json()) as { words?: WordItem[] };
        if (!cancelled) {
          const w = d.words ?? [];
          if (w.length > 0) {
            setWords(w);
          } else {
            applyFallback();
          }
        }
      } catch {
        if (!cancelled) applyFallback();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [surahId, ayahNo, arabic, meal]);

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 ${
        compact ? "gap-2" : ""
      }`}
      onMouseLeave={() => setActiveIndex(null)}
    >
      <div className="order-1 md:order-2 text-emerald-900 dark:text-emerald-100">
        <AyahArabicWithTooltip
          surahId={surahId}
          ayahNo={ayahNo}
          arabic={arabic}
          compact={compact}
          words={words}
          activeIndex={activeIndex}
          onHoverIndex={setActiveIndex}
        />
      </div>
      <div className="order-2 md:order-1">
        <MealSwitcher
          surahId={surahId}
          ayahNo={ayahNo}
          initialMeal={meal}
          compact={compact}
        />
      </div>
    </div>
  );
}
