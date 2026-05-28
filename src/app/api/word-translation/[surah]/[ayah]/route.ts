import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  arabicWordsFromPlainText,
  buildAlignedFromVerseParts,
  buildAlignedWords,
  filterQuranWords,
  type AcikKuranVersePart,
  type AlignedWord,
  type QuranWordInput,
} from "@/lib/ayah-word-align";

type QuranComVerseResponse = {
  verse?: { words?: QuranWordInput[] };
};

type AcikKuranPartsResponse = {
  data?: AcikKuranVersePart[];
};

async function fetchAcikKuranWords(surahId: number, ayahNo: number): Promise<AlignedWord[] | null> {
  try {
    const response = await fetch(
      `https://api.acikkuran.com/surah/${surahId}/verse/${ayahNo}/verseparts`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      }
    );
    if (!response.ok) return null;
    const partsData = (await response.json()) as AcikKuranPartsResponse;
    const parts = partsData.data ?? [];
    if (parts.length === 0) return null;
    return buildAlignedFromVerseParts(parts);
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ surah: string; ayah: string }> }
) {
  const { surah, ayah } = await params;
  const surahId = parseInt(surah, 10);
  const ayahNo = parseInt(ayah, 10);

  if (Number.isNaN(surahId) || Number.isNaN(ayahNo)) {
    return NextResponse.json({ error: "Geçersiz sure/ayet" }, { status: 400 });
  }

  const localAyah = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId, number: ayahNo } },
    select: { meal: true, arabic: true },
  });
  if (!localAyah) {
    return NextResponse.json({ error: "Ayet bulunamadı" }, { status: 404 });
  }

  const acikKuranWords = await fetchAcikKuranWords(surahId, ayahNo);
  if (acikKuranWords && acikKuranWords.length > 0) {
    return NextResponse.json({
      source: "api.acikkuran.com",
      meal: localAyah.meal,
      words: acikKuranWords,
    });
  }

  const verseKey = `${surahId}:${ayahNo}`;
  const url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani,char_type_name`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });

    if (response.ok) {
      const data = (await response.json()) as QuranComVerseResponse;
      const rawWords = data.verse?.words ?? [];
      const filtered = filterQuranWords(rawWords);

      if (filtered.length > 0) {
        const arabicList = filtered.map((w) => ({ arabic: w.text_uthmani }));
        const words = buildAlignedWords(arabicList, localAyah.meal);
        return NextResponse.json({
          source: "api.quran.com-fallback",
          meal: localAyah.meal,
          words,
        });
      }
    }
  } catch {
    /* harici API başarısız */
  }

  const fallbackArabic = localAyah.arabic?.trim()
    ? arabicWordsFromPlainText(localAyah.arabic)
    : arabicWordsFromPlainText("");

  if (fallbackArabic.length === 0) {
    return NextResponse.json({ words: [] });
  }

  const words = buildAlignedWords(fallbackArabic, localAyah.meal);
  return NextResponse.json({
    source: "local-fallback",
    meal: localAyah.meal,
    words,
  });
}
