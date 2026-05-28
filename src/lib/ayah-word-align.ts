/** Arapça kelime ile meal dilimi eşlemesi (0 tabanlı index) */
export type AlignedWord = {
  index: number;
  arabic: string;
  tr: string;
  /** Okunuş (Açık Kuran) */
  transcription?: string;
};

export type MealSpanPart = {
  text: string;
  index: number | null;
};

export type QuranWordInput = {
  position: number;
  text_uthmani: string;
  char_type_name?: string;
};

export type AcikKuranVersePart = {
  sort_number: number;
  arabic: string;
  translation_tr?: string;
  transcription_tr?: string;
};

/** Ayet numarası gibi 'end' kelimelerini çıkarır */
export function filterQuranWords(words: QuranWordInput[]): QuranWordInput[] {
  return [...words]
    .filter((w) => w.char_type_name !== "end")
    .sort((a, b) => a.position - b.position);
}

/** Açık Kuran verseparts → hizalı kelime listesi */
export function buildAlignedFromVerseParts(parts: AcikKuranVersePart[]): AlignedWord[] {
  return [...parts]
    .sort((a, b) => a.sort_number - b.sort_number)
    .map((p, i) => ({
      index: i,
      arabic: p.arabic,
      tr: (p.translation_tr ?? "").trim(),
      transcription: (p.transcription_tr ?? "").trim() || undefined,
    }))
    .filter((w) => w.arabic.trim());
}

/** Meal metnini kelime/token dizisine ayırır (fallback) */
export function tokenizeMeal(meal: string): string[] {
  return meal
    .replace(/[.,;:!?()"']/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Arapça kelime listesi ile meal metnini oransal hizalar (son çare) */
export function buildAlignedWords(
  arabicWords: { arabic: string }[],
  mealText: string
): AlignedWord[] {
  const tokens = tokenizeMeal(mealText);
  const trCount = tokens.length;
  const arCount = arabicWords.length;

  if (arCount === 0) return [];

  return arabicWords.map((w, i) => {
    const start = Math.floor((i * trCount) / arCount);
    const end = Math.max(start + 1, Math.floor(((i + 1) * trCount) / arCount));
    const mealSpan = trCount > 0 ? tokens.slice(start, end).join(" ") : "";
    return {
      index: i,
      arabic: w.arabic,
      tr: mealSpan,
    };
  });
}

/**
 * Tam meal cümlesinde her kelimenin Türkçe gloss'unu bularak index'li span üretir.
 * Gloss'lar Arapça kelime sırasındadır; meal cümlesindeki konumlarına göre sıralanır.
 */
export function buildMealSpansFromGlosses(
  aligned: AlignedWord[],
  fullMealText: string
): MealSpanPart[] {
  if (aligned.length === 0) return [{ text: fullMealText, index: null }];

  const lowerMeal = fullMealText.toLocaleLowerCase("tr");
  const candidates = aligned
    .filter((w) => w.tr.trim())
    .sort((a, b) => b.tr.length - a.tr.length);

  const used: { start: number; end: number; index: number }[] = [];
  for (const w of candidates) {
    const tr = w.tr.trim();
    const needle = tr.toLocaleLowerCase("tr");
    let searchFrom = 0;
    while (searchFrom < lowerMeal.length) {
      const idx = lowerMeal.indexOf(needle, searchFrom);
      if (idx < 0) break;
      const end = idx + tr.length;
      const overlaps = used.some((u) => idx < u.end && end > u.start);
      if (!overlaps) {
        used.push({ start: idx, end, index: w.index });
        break;
      }
      searchFrom = idx + 1;
    }
  }

  used.sort((a, b) => a.start - b.start);

  if (used.length === 0) {
    return aligned.map((w, i) => ({
      text: w.tr + (i < aligned.length - 1 ? " " : ""),
      index: w.index,
    }));
  }

  const parts: MealSpanPart[] = [];
  let cursor = 0;
  for (const m of used) {
    if (m.start > cursor) {
      parts.push({ text: fullMealText.slice(cursor, m.start), index: null });
    }
    parts.push({
      text: fullMealText.slice(m.start, m.end),
      index: m.index,
    });
    cursor = m.end;
  }
  if (cursor < fullMealText.length) {
    parts.push({ text: fullMealText.slice(cursor), index: null });
  }

  return parts;
}

/** Yerel Arapça düz metinden kaba kelime listesi (API yokken fallback) */
export function arabicWordsFromPlainText(arabic: string): { arabic: string }[] {
  return arabic
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((arabic) => ({ arabic }));
}
