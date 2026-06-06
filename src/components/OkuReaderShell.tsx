"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AyahStickyHeader } from "@/components/AyahStickyHeader";
import { TafsirReader, type TafsirSummary } from "@/components/TafsirReader";
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
  focusHighlightId?: string;
  focusNoteId?: string;
  focusFind?: string;
  focusOffset?: number;
  flash?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    resolveInitialTafsirId(tafsirs, initialTafsirId)
  );
  const [showNotes, setShowNotes] = useState(false);

  const handleTafsirChange = useCallback((id: number) => {
    setPreferredTafsirId(id);
    setSelectedId(id);
    setShowNotes(false);
  }, []);

  // Verilen tefsirden sonrakine; o son tefsirse sıradaki ayete (gerekirse sonraki sûre) geçer
  const handleAdvance = useCallback(
    (fromTafsirId: number | null) => {
      const idx = tafsirs.findIndex((t) => t.id === fromTafsirId);
      const nextTafsir = idx >= 0 ? tafsirs[idx + 1] : undefined;
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
    [tafsirs, ayahNo, surahMeta.id, surahMeta.ayetCount, router]
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
        tafsirs={tafsirs}
        selectedId={selectedId}
        onSelectedIdChange={handleTafsirChange}
        showNotes={showNotes}
        onShowNotesChange={setShowNotes}
        onAdvance={handleAdvance}
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
