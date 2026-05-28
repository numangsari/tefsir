// Tüm tefsir içeriklerini disk üzerinde per-ayet JSON dosyalarına dök.
// data/tafsir-export/T001/001/001.json gibi.
//
// Kullanım: npm run export:tafsirs
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();
const OUT_ROOT = join(process.cwd(), "data", "tafsir-export");

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

async function main() {
  await mkdir(OUT_ROOT, { recursive: true });

  const tafsirs = await prisma.tafsir.findMany({ orderBy: { order: "asc" } });
  const surahs = await prisma.surah.findMany({ orderBy: { id: "asc" } });

  // Üst düzey index
  const index = {
    generatedAt: new Date().toISOString(),
    note: "Tefsir Projesi — Tefsirsitesi.com'dan derlenen Türkçe tefsirler. Her dosya tek bir tefsir × tek bir ayetin metni.",
    tafsirs: tafsirs.map((t) => ({
      code: t.code,
      name: t.name,
      author: t.author,
      slug: t.slug,
      order: t.order,
      deathYearHijri: t.deathYearHijri,
      deathYearGregorian: t.deathYearGregorian,
    })),
    surahs: surahs.map((s) => ({
      id: s.id,
      nameTr: s.nameTr,
      nameAr: s.nameAr,
      ayetCount: s.ayetCount,
    })),
  };
  await writeFile(join(OUT_ROOT, "index.json"), JSON.stringify(index, null, 2), "utf8");

  // README
  const readme = `# Tefsir Export

Tefsirsitesi.com'dan derlenen 13 Türkçe tefsirin ayet-bazlı JSON dökümü.

## Klasör yapısı
\`\`\`
data/tafsir-export/
  README.md
  index.json                # tefsir ve sure kataloğu
  T001/                     # Beydâvî Tefsiri
    001/                    # Fâtiha Sûresi (3 haneli sure no)
      001.json              # 1. ayet
      002.json
      ...
    002/                    # Bakara Sûresi
      ...
  T002/                     # Celâleyn Tefsiri
  ...
\`\`\`

## Tek bir JSON dosyasının şeması
\`\`\`json
{
  "id": "T001_001_001",
  "tafsir": {
    "code": "T001",
    "name": "Beydâvî Tefsiri",
    "author": "Kâdî Beydâvî",
    "deathYearHijri": 685,
    "deathYearGregorian": 1286
  },
  "surah": { "id": 1, "nameTr": "Fâtiha", "nameAr": "الفاتحة" },
  "ayah": {
    "number": 1,
    "arabic": "بِسْمِ ٱللَّهِ...",
    "meal": "Rahmân ve Rahîm olan Allah'ın adıyla."   // Diyanet meali
  },
  "text": "Tefsir metni paragraflar \\n\\n ile ayrılmış olarak..."
}
\`\`\`

## OpenAI sadeleştirme pipeline'ı için öneriler

- **Resume**: bir ayeti işledikten sonra çıktıyı yanına \`001.modern.json\` olarak yaz. Script tekrar çalışınca sadece kardeş dosyası olmayanları işle.
- **Paralel çalıştırma**: dosyalar ayrı olduğu için race condition yok. \`p-limit\` ile concurrency = 5-10 idealdir.
- **Prompt**: her dosyaya tek başına self-contained yazıldı; sistem prompt'unda tefsirin yazıldığı dönem (deathYearGregorian) belirtilirse model daha doğru sadeleştirir.
- **Hatalar**: API hatasında dosyayı yazma; bir sonraki çalışmada o ayet tekrar denenir.

## İstatistik
11 tefsir × 6236 ayet = 68.596 olası dosya.
Sitenin 404 verdiği bazı ayetler nedeniyle gerçek dosya sayısı ~81.012'dir.
`;
  await writeFile(join(OUT_ROOT, "README.md"), readme, "utf8");

  // Her tefsir için klasör + dosyalar
  let written = 0;
  const startedAt = Date.now();
  const tafsirMap = new Map(tafsirs.map((t) => [t.id, t]));
  const surahMap = new Map(surahs.map((s) => [s.id, s]));

  for (const t of tafsirs) {
    const tafsirDir = join(OUT_ROOT, t.code);
    await mkdir(tafsirDir, { recursive: true });

    // O tefsirin tüm içeriklerini al (sure × ayet sıralı)
    const contents = await prisma.tafsirContent.findMany({
      where: { tafsirId: t.id },
      include: {
        ayah: { include: { surah: true } },
      },
      orderBy: [
        { ayah: { surahId: "asc" } },
        { ayah: { number: "asc" } },
      ],
    });

    let lastSurahId = -1;
    let surahDir = "";
    for (const c of contents) {
      if (c.ayah.surahId !== lastSurahId) {
        surahDir = join(tafsirDir, pad3(c.ayah.surahId));
        await mkdir(surahDir, { recursive: true });
        lastSurahId = c.ayah.surahId;
      }

      const surahMeta = surahMap.get(c.ayah.surahId)!;
      const out = {
        id: `${t.code}_${pad3(c.ayah.surahId)}_${pad3(c.ayah.number)}`,
        tafsir: {
          code: t.code,
          name: t.name,
          author: t.author,
          deathYearHijri: t.deathYearHijri,
          deathYearGregorian: t.deathYearGregorian,
        },
        surah: {
          id: surahMeta.id,
          nameTr: surahMeta.nameTr,
          nameAr: surahMeta.nameAr,
        },
        ayah: {
          number: c.ayah.number,
          arabic: c.ayah.arabic,
          meal: c.ayah.meal,
        },
        text: c.text,
      };

      const fileName = `${pad3(c.ayah.number)}.json`;
      await writeFile(join(surahDir, fileName), JSON.stringify(out, null, 2), "utf8");
      written++;
      if (written % 1000 === 0) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = written / elapsed;
        process.stdout.write(
          `\r${written.toLocaleString("tr-TR")} dosya yazıldı (${rate.toFixed(0)}/s)`
        );
      }
    }
    console.log(`\n${t.code} (${t.name}) tamam — ${contents.length} ayet`);
  }
  void tafsirMap;

  const elapsed = (Date.now() - startedAt) / 1000;
  console.log(
    `\nToplam ${written.toLocaleString(
      "tr-TR"
    )} dosya yazıldı. Süre: ${elapsed.toFixed(1)}s.`
  );
  console.log(`Konum: ${OUT_ROOT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
