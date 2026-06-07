"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AyahStickyHeader } from "@/components/AyahStickyHeader";
import { TafsirReader, type TafsirSummary, type TafsirData } from "@/components/TafsirReader";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { resolveInitialTafsirId, setPreferredTafsirId } from "@/lib/preferred-tafsir";

type SurahMeta = {
  id: number;
  nameTr: string;
  ayetCount: number;
  revelationType: string | null;
  meaning: string | null;
  revelationOrder: number | null;
};

export function OkuReaderShell({
  surahMeta,
  ayahNo,
  ayahId,
  arabic,
  meal,
  allSurahs,
  surahName,
  tafsirs,
  initialTafsirId,
  initialTafsir,
  focusHighlightId,
  focusNoteId,
  focusFind,
  focusOffset,
  flash,
}: {
  surahMeta: SurahMeta;
  ayahNo: number;
  ayahId: number;
  arabic: string;
  meal: string;
  allSurahs: { id: number; nameTr: string; ayetCount: number }[];
  surahName: string;
  tafsirs: TafsirSummary[];
  initialTafsirId?: number;
  initialTafsir?: TafsirData | null;
  focusHighlightId?: string;
  focusNoteId?: string;
  focusFind?: string;
  focusOffset?: number;
  flash?: string;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    resolveInitialTafsirId(tafsirs, initialTafsirId)
  );
  const [showNotes, setShowNotes] = useState(false);

  // Favori tefsir id'leri (girişli kullanıcılara özel)
  const [favoriteTafsirIds, setFavoriteTafsirIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my/favorite-tafsirs")
      .then((r) => r.json())
      .then((d: { tafsirIds?: number[] }) => {
        if (d.tafsirIds) setFavoriteTafsirIds(new Set(d.tafsirIds));
      })
      .catch(() => {});
  }, [status]);

  // Favoriler listenin başında, her grup kendi içinde orijinal sırayı korur
  const sortedTafsirs = useMemo(() => {
    if (favoriteTafsirIds.size === 0) return tafsirs;
    const favs = tafsirs.filter((t) => favoriteTafsirIds.has(t.id));
    const rest = tafsirs.filter((t) => !favoriteTafsirIds.has(t.id));
    return [...favs, ...rest];
  }, [tafsirs, favoriteTafsirIds]);

  async function toggleFavorite(tafsirId: number) {
    const isFav = favoriteTafsirIds.has(tafsirId);
    // Optimistik güncelleme
    setFavoriteTafsirIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(tafsirId);
      else next.add(tafsirId);
      return next;
    });
    await fetch("/api/my/favorite-tafsirs", {
      method: isFav ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tafsirId }),
    }).catch(() => {
      // Hata olursa geri al
      setFavoriteTafsirIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(tafsirId);
        else next.delete(tafsirId);
        return next;
      });
    });
  }

  const handleTafsirChange = useCallback((id: number) => {
    setPreferredTafsirId(id);
    setSelectedId(id);
    setShowNotes(false);
  }, []);

  // sortedTafsirs üzerinden ilerle — listenin görünen sırasıyla tutarlı
  const handleAdvance = useCallback(
    (fromTafsirId: number | null) => {
      const idx = sortedTafsirs.findIndex((t) => t.id === fromTafsirId);
      const nextTafsir = idx >= 0 ? sortedTafsirs[idx + 1] : undefined;
      if (nextTafsir) {
        setPreferredTafsirId(nextTafsir.id);
        setSelectedId(nextTafsir.id);
        setShowNotes(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // Son tefsirdeyiz → sıradaki ayet
      const qs = fromTafsirId ? `?tafsir=${fromTafsirId}` : "";
      if (ayahNo < surahMeta.ayetCount) {
        router.push(`/oku/${surahMeta.id}/${ayahNo + 1}${qs}`);
      } else if (surahMeta.id < 114) {
        router.push(`/oku/${surahMeta.id + 1}/1${qs}`);
      }
    },
    [sortedTafsirs, ayahNo, surahMeta.id, surahMeta.ayetCount, router]
  );

  return (
    <>
      <AyahStickyHeader
        surahMeta={surahMeta}
        ayahNo={ayahNo}
        arabic={arabic}
        meal={meal}
        allSurahs={allSurahs}
        tafsirId={selectedId}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((v) => !v)}
        bookmarkProps={{
          surahId: surahMeta.id,
          ayahNo,
          tafsirId: selectedId,
        }}
        flash={flash}
      />
      <TafsirReader
        surahId={surahMeta.id}
        ayahNo={ayahNo}
        ayahId={ayahId}
        surahName={surahName}
        tafsirs={sortedTafsirs}
        selectedId={selectedId}
        initialTafsir={initialTafsir}
        onSelectedIdChange={handleTafsirChange}
        showNotes={showNotes}
        onShowNotesChange={setShowNotes}
        onAdvance={handleAdvance}
        favoriteTafsirIds={favoriteTafsirIds}
        onFavoriteToggle={status === "authenticated" ? toggleFavorite : undefined}
        focusHighlightId={focusHighlightId}
        focusNoteId={focusNoteId}
        focusFind={focusFind}
        focusOffset={focusOffset}
        flash={flash}
      />
      <ScrollToTopButton />
    </>
  );
}
