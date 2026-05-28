// Türkçe mealler çek (alquran.cloud)
// Diyanet zaten Ayah.meal'da olduğu için onu da Translation tablosunda mirror'larız.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EDITIONS = [{ code: "tr.diyanet", name: "Diyanet İşleri", isDefault: true }];

type ApiAyah = { numberInSurah: number; text: string };
type ApiSurah = { number: number; ayahs: ApiAyah[] };
type ApiResp = { data: { surahs: ApiSurah[] } };

async function main() {
  for (const ed of EDITIONS) {
    console.log(`\n=== ${ed.code} — ${ed.name} ===`);
    const editionRec = await prisma.translationEdition.upsert({
      where: { code: ed.code },
      create: { code: ed.code, name: ed.name, language: "tr", isDefault: !!ed.isDefault },
      update: { name: ed.name, isDefault: !!ed.isDefault },
    });

    const url = `https://api.alquran.cloud/v1/quran/${ed.code}`;
    console.log("GET", url);
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`HTTP ${r.status}`);
      continue;
    }
    const j = (await r.json()) as ApiResp;
    let written = 0;
    await prisma.$transaction(
      async (tx) => {
        for (const s of j.data.surahs) {
          for (const a of s.ayahs) {
            const ayah = await tx.ayah.findUnique({
              where: { surahId_number: { surahId: s.number, number: a.numberInSurah } },
              select: { id: true },
            });
            if (!ayah) continue;
            await tx.translation.upsert({
              where: {
                editionId_ayahId: { editionId: editionRec.id, ayahId: ayah.id },
              },
              create: { editionId: editionRec.id, ayahId: ayah.id, text: a.text },
              update: { text: a.text },
            });
            written++;
            if (written % 1000 === 0) {
              process.stdout.write(`\r${written} ayet`);
            }
          }
        }
      },
      { timeout: 10 * 60 * 1000 }
    );
    console.log(`\n${ed.code} tamam — ${written} ayet`);
  }

  console.log("\nBitti.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
