"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";
import { useRequireAuth } from "@/lib/use-require-auth";
import {
  BOOKMARK_EVENT,
  emitBookmarkChange,
  fetchBookmark,
  type BookmarkData,
} from "@/lib/bookmark-events";

function matchesCurrent(
  bookmark: BookmarkData,
  surahId: number,
  ayahNo: number,
  tafsirId: number | null
) {
  return (
    bookmark.surahId === surahId &&
    bookmark.ayahNo === ayahNo &&
    (bookmark.tafsirId ?? null) === (tafsirId ?? null)
  );
}

export function BookmarkButton({
  surahId,
  ayahNo,
  tafsirId,
  compact = false,
}: {
  surahId: number;
  ayahNo: number;
  tafsirId: number | null;
  compact?: boolean;
}) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const [, setSavedAt] = useState<string | null>(null);
  const [isHere, setIsHere] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyBookmark = useCallback(
    (bookmark: BookmarkData | null) => {
      if (bookmark && matchesCurrent(bookmark, surahId, ayahNo, tafsirId)) {
        setIsHere(true);
        setSavedAt(bookmark.at);
      } else {
        setIsHere(false);
        setSavedAt(null);
      }
    },
    [surahId, ayahNo, tafsirId]
  );

  const syncFromServer = useCallback(async () => {
    const bookmark = await fetchBookmark();
    applyBookmark(bookmark);
    return bookmark;
  }, [applyBookmark]);

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    function onBookmarkChange(e: Event) {
      const bookmark = (e as CustomEvent<BookmarkData | null>).detail ?? null;
      applyBookmark(bookmark);
    }
    window.addEventListener(BOOKMARK_EVENT, onBookmarkChange);
    return () => window.removeEventListener(BOOKMARK_EVENT, onBookmarkChange);
  }, [applyBookmark]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    if (!requireAuth()) return;
    setLoading(true);
    try {
      if (isHere) {
        const r = await fetch("/api/my/bookmark", { method: "DELETE" });
        if (r.ok) {
          setIsHere(false);
          setSavedAt(null);
          emitBookmarkChange(null);
          toast.success("Burada kaldım işareti kaldırıldı.");
        } else {
          toast.error("İşaret kaldırılamadı.");
        }
      } else {
        const r = await fetch("/api/my/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surahId, ayahNo, tafsirId }),
        });
        if (r.ok) {
          const bookmark = await fetchBookmark();
          if (bookmark) {
            setIsHere(true);
            setSavedAt(bookmark.at);
            emitBookmarkChange(bookmark);
          }
          toast.success("Burada kaldım kaydedildi.");
        } else {
          toast.error("Kaydedilemedi. Giriş yaptığınızdan emin olun.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isHere}
      aria-busy={loading}
      title={isHere ? "Buradayım işaretini kaldır" : "Buradayım, bu ayet/tefsir kaydedilsin"}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-all ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
      } ${loading ? "cursor-wait opacity-80" : "cursor-pointer"} ${
        isHere
          ? "bg-amber-600 text-white border-amber-600 shadow-sm hover:bg-amber-700"
          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:border-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
      }`}
    >
      <span className="text-sm leading-none" aria-hidden>
        {isHere ? "★" : "☆"}
      </span>
      <span>{isHere ? "Burada kaldım" : "Burada kaldım"}</span>
    </button>
  );
}
