"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AyahSelector } from "@/components/AyahSelector";
import { AyahWordBridge } from "@/components/AyahWordBridge";
import { BookmarkButton } from "@/components/BookmarkButton";

type SurahMeta = {
  id: number;
  nameTr: string;
  ayetCount: number;
  revelationType: string | null;
  meaning: string | null;
  revelationOrder: number | null;
};

export function AyahStickyHeader({
  surahMeta,
  ayahNo,
  arabic,
  meal,
  allSurahs,
  tafsirId,
  showNotes,
  onToggleNotes,
  bookmarkProps,
  flash,
}: {
  surahMeta: SurahMeta;
  ayahNo: number;
  arabic: string;
  meal: string;
  allSurahs: { id: number; nameTr: string; ayetCount: number }[];
  tafsirId?: number | null;
  showNotes?: boolean;
  onToggleNotes?: () => void;
  bookmarkProps?: { surahId: number; ayahNo: number; tafsirId: number | null };
  flash?: string;
}) {
  const [compact, setCompact] = useState(false);
  const [flashRing, setFlashRing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 90);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (flash !== "meal" && flash !== "ayah") return;
    setFlashRing(true);
    const t = window.setTimeout(() => setFlashRing(false), 2400);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flash");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    return () => window.clearTimeout(t);
  }, [flash, pathname, router, searchParams]);

  const revelationLabel =
    surahMeta.revelationType === "mekki"
      ? "Mekkî"
      : surahMeta.revelationType === "medeni"
      ? "Medenî"
      : null;

  return (
    <div
      id="ayah-sticky-header"
      className={`sticky top-0 z-10 -mx-4 px-4 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-all ${
        compact ? "py-2" : "py-3"
      } ${flashRing && flash === "ayah" ? "ring-2 ring-amber-500 ring-inset" : ""}`}
    >
      {/* Başlık + meta rozetler */}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <h2
          className={`font-semibold text-emerald-800 dark:text-emerald-200 ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          <span className="text-emerald-600 dark:text-emerald-400">{surahMeta.nameTr}</span>
          <span className="text-stone-400 dark:text-stone-500 font-normal mx-1.5">·</span>
          <span>{ayahNo}. ayet</span>
        </h2>
        {!compact && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {revelationLabel && (
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  surahMeta.revelationType === "mekki"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                    : "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                }`}
              >
                {revelationLabel}
              </span>
            )}
            {surahMeta.meaning && (
              <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {surahMeta.meaning}
              </span>
            )}
            {surahMeta.revelationOrder != null && (
              <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                Nüzul {surahMeta.revelationOrder}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              {surahMeta.ayetCount} ayet
            </span>
          </div>
        )}
      </div>

      {/* Araç çubuğu: gezinme + eylemler */}
      <div
        className={`rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm ${
          compact ? "p-1.5" : "p-2"
        } mb-3`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
          <div className="flex-1 min-w-0">
            <AyahSelector
              variant="toolbar"
              current={{ surahId: surahMeta.id, ayahNo, ayetCount: surahMeta.ayetCount }}
              surahs={allSurahs}
              tafsirId={tafsirId}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 lg:border-l lg:border-stone-200 lg:dark:border-stone-700 lg:pl-3">
            {onToggleNotes && (
              <button
                type="button"
                onClick={onToggleNotes}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  showNotes
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:border-amber-400"
                }`}
              >
                <span aria-hidden>📝</span>
                {showNotes ? "Tefsire dön" : "Notlar"}
              </button>
            )}
            {bookmarkProps && (
              <BookmarkButton
                surahId={bookmarkProps.surahId}
                ayahNo={bookmarkProps.ayahNo}
                tafsirId={bookmarkProps.tafsirId}
                compact
              />
            )}
          </div>
        </div>
      </div>

      {/* Arapça + meal */}
      <div
        className={flashRing && flash === "meal" ? "ring-2 ring-amber-500 rounded-lg p-1" : ""}
      >
        <AyahWordBridge
          surahId={surahMeta.id}
          ayahNo={ayahNo}
          arabic={arabic}
          meal={meal}
          compact={compact}
        />
      </div>
    </div>
  );
}
