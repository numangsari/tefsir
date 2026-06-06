import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/**
 * Okuyucu sayfasının veri erişimi. İki tür önbellek kullanılır:
 *  - React `cache`: aynı HTTP isteği içinde tekrar eden Prisma çağrılarını birleştirir
 *    (generateMetadata ile sayfa gövdesi aynı sûre/ayet'i iki kez sorgulamasın).
 *  - `unstable_cache`: kullanıcıdan bağımsız, neredeyse sabit veriyi (sûre listesi,
 *    sadeleştirilmiş tefsir metni) istekler arasında önbelleğe alır → DB round-trip yok.
 */

// 114 sûre — sabit referans veri. İstekler arası önbellek.
export const getAllSurahs = unstable_cache(
  () =>
    prisma.surah.findMany({
      orderBy: { id: "asc" },
      select: { id: true, nameTr: true, ayetCount: true },
    }),
  ["all-surahs"],
  { revalidate: 86400, tags: ["surahs"] }
);

// Tek sûre meta — istek içi dedupe (generateMetadata + sayfa paylaşır).
export const getSurah = cache((id: number) =>
  prisma.surah.findUnique({ where: { id } })
);

// Tek ayet (arabic + meal + id) — istek içi dedupe.
export const getAyah = cache((surahId: number, number: number) =>
  prisma.ayah.findUnique({ where: { surahId_number: { surahId, number } } })
);

// Bu ayet için sadeleştirilmiş içeriği olan tefsirler (gösterim sırasında).
export const getAyahTafsirs = cache((ayahId: number) =>
  prisma.tafsir.findMany({
    where: { contents: { some: { ayahId, modernizedAt: { not: null } } } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      author: true,
      deathYearHijri: true,
      deathYearGregorian: true,
    },
  })
);

// Bir tefsirin bir ayetteki sadeleştirilmiş ham metni — kullanıcıdan bağımsız (statik).
// SSR seed için kullanılır; istekler arası önbellek. Vurgu/notlar burada YOK
// (kullanıcıya özel; istemci ayrıca çeker). Ham metin döner, baş/son temizliği
// (cleanTafsirText) çağrı tarafında yapılır (ayahNo'ya bağlı, ucuz, saf fonksiyon).
export const getModernizedTafsirRaw = unstable_cache(
  async (tafsirId: number, ayahId: number) => {
    const c = await prisma.tafsirContent.findUnique({
      where: { tafsirId_ayahId: { tafsirId, ayahId } },
      select: {
        tafsirId: true,
        text: true,
        modernizedAt: true,
        modernizedBy: true,
        tafsir: { select: { id: true, code: true, name: true } },
      },
    });
    if (!c || !c.modernizedAt) return null;
    return {
      tafsirId: c.tafsirId,
      code: c.tafsir.code,
      name: c.tafsir.name,
      text: c.text,
      modernizedAt: c.modernizedAt.toISOString(),
      modernizedBy: c.modernizedBy,
    };
  },
  ["modernized-tafsir-raw"],
  { revalidate: 86400, tags: ["tafsir-content"] }
);
