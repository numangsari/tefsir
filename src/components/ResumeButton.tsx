"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BOOKMARK_EVENT, fetchBookmark, type BookmarkData } from "@/lib/bookmark-events";

export function ResumeButton() {
  const [bm, setBm] = useState<BookmarkData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const bookmark = await fetchBookmark();
    setBm(bookmark);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onBookmarkChange(e: Event) {
      const bookmark = (e as CustomEvent<BookmarkData | null>).detail ?? null;
      setBm(bookmark);
      setLoaded(true);
    }
    window.addEventListener(BOOKMARK_EVENT, onBookmarkChange);
    return () => window.removeEventListener(BOOKMARK_EVENT, onBookmarkChange);
  }, []);

  if (!loaded || !bm) return null;

  const href = `/oku/${bm.surahId}/${bm.ayahNo}${
    bm.tafsirId ? `?tafsir=${bm.tafsirId}` : ""
  }`;

  return (
    <div className="mb-2 flex justify-end">
      <Link
        href={href}
        className="inline-flex items-center gap-2 max-w-full rounded-full border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-1 text-xs text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors shadow-sm"
      >
        <span className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden>
          ★
        </span>
        <span className="truncate">
          <span className="font-medium">{bm.surahName}</span>
          <span className="text-amber-800/80 dark:text-amber-200/80">
            {" "}
            · {bm.ayahNo}. ayet
            {bm.tafsirName ? ` · ${bm.tafsirName}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-emerald-700 dark:text-emerald-400 font-medium">
          Devam →
        </span>
      </Link>
    </div>
  );
}
