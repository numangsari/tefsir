"use client";

import { useCallback, useState } from "react";
import { AyahStickyHeader } from "@/components/AyahStickyHeader";
import { TafsirReader, type TafsirSummary } from "@/components/TafsirReader";
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
  flash?: string;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    resolveInitialTafsirId(tafsirs, initialTafsirId)
  );
  const [showNotes, setShowNotes] = useState(false);

  const handleTafsirChange = useCallback((id: number) => {
    setPreferredTafsirId(id);
    setSelectedId(id);
    setShowNotes(false);
  }, []);

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
        focusHighlightId={focusHighlightId}
        focusNoteId={focusNoteId}
        focusFind={focusFind}
        flash={flash}
      />
    </>
  );
}
