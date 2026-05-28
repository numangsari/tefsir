// Arapça metin ve Diyanet meali için alquran.cloud API'sinden tüm Kur'an'ı çeker
// ve Ayah tablosuna doldurur. Tek seferde 6236 ayet.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ApiAyah = {
  number: number;
  text: string;
  numberInSurah: number;
};
type ApiSurah = { number: number; ayahs: ApiAyah[] };
type ApiResp = { data: { surahs: ApiSurah[] } };

type FlatAyah = { surahId: number; number: number; text: string };

async function fetchEdition(edition: string): Promise<FlatAyah[]> {
  const url = `https://api.alquran.cloud/v1/quran/${edition}`;
  console.log("GET", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  const j = (await r.json()) as ApiResp;
  const out: FlatAyah[] = [];
  for (const s of j.data.surahs) {
    for (const a of s.ayahs) {
      out.push({ surahId: s.number, number: a.numberInSurah, text: a.text });
    }
  }
  return out;
}

async function main() {
  const [arabic, meal] = await Promise.all([
    fetchEdition("quran-uthmani"),
    fetchEdition("tr.diyanet"),
  ]);

  if (arabic.length !== meal.length) {
    console.warn(`Uyarı: arapça ${arabic.length}, meal ${meal.length} sayısı uyumsuz`);
  }

  const mealMap = new Map<string, string>();
  for (const a of meal) mealMap.set(`${a.surahId}:${a.number}`, a.text);

  let written = 0;
  await prisma.$transaction(async (tx) => {
    for (const a of arabic) {
      const key = `${a.surahId}:${a.number}`;
      const m = mealMap.get(key) ?? "";
      await tx.ayah.upsert({
        where: { surahId_number: { surahId: a.surahId, number: a.number } },
        create: { surahId: a.surahId, number: a.number, arabic: a.text, meal: m },
        update: { arabic: a.text, meal: m },
      });
      written++;
      if (written % 500 === 0) console.log(`${written} ayet yazıldı...`);
    }
  }, { timeout: 5 * 60 * 1000 });

  console.log(`Tamam. Toplam ${written} ayet.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
