import "./load-env";
import { prisma } from "../src/lib/prisma";

// Tek seferlik performans ölçümü. Sadece OKUR (count/EXPLAIN); hiçbir yazma yapmaz.
// Çalıştır: npx tsx scripts/perf-measure.ts [aramaKelimesi]
// EXPLAIN ANALYZE planları gerçek satır taraması ve süreyi gösterir.

const TERM = process.argv[2] ?? "rahmet";

function ms(n: number) {
  return `${n.toFixed(1)} ms`;
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  const r = await fn();
  const dt = performance.now() - t0;
  console.log(`  ⏱  ${label}: ${ms(dt)}`);
  return r;
}

async function explain(label: string, sql: string) {
  console.log(`\n── EXPLAIN: ${label}`);
  const rows = (await prisma.$queryRawUnsafe(
    `EXPLAIN (ANALYZE, BUFFERS, TIMING) ${sql}`
  )) as Array<Record<string, string>>;
  for (const r of rows) {
    const line = Object.values(r)[0];
    // Yalnızca özet satırları (tarama tipi + süre) öne çıkar
    console.log("   " + line);
  }
}

async function main() {
  console.log(`\n===== tefsirnet performans ölçümü =====`);
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@") ?? "?"}`);
  console.log(`Arama kelimesi: "${TERM}"\n`);

  // 1) Satır sayıları (ölçek)
  console.log("=== Tablo boyutları ===");
  const [ayah, tafsirContent, modernized, translation, surah, note, hl] = await Promise.all([
    prisma.ayah.count(),
    prisma.tafsirContent.count(),
    prisma.tafsirContent.count({ where: { modernizedAt: { not: null } } }),
    prisma.translation.count(),
    prisma.surah.count(),
    prisma.note.count(),
    prisma.highlight.count(),
  ]);
  console.log(`  Ayah:                 ${ayah}`);
  console.log(`  TafsirContent:        ${tafsirContent}  (sadeleştirilmiş: ${modernized})`);
  console.log(`  Translation:          ${translation}`);
  console.log(`  Surah:                ${surah}`);
  console.log(`  Note / Highlight:     ${note} / ${hl}`);

  // Ortalama tefsir metin uzunluğu (tarama maliyetinin göstergesi)
  const avg = (await prisma.$queryRawUnsafe(
    `SELECT round(avg(char_length(text))) AS avg_len, max(char_length(text)) AS max_len FROM "TafsirContent"`
  )) as Array<{ avg_len: number; max_len: number }>;
  console.log(`  Tefsir metni uzunluğu: ort ${avg[0]?.avg_len}, maks ${avg[0]?.max_len} karakter`);

  // 2) Mevcut eklentiler ve indeksler
  console.log("\n=== pg eklentileri ===");
  const ext = (await prisma.$queryRawUnsafe(
    `SELECT extname FROM pg_extension ORDER BY extname`
  )) as Array<{ extname: string }>;
  console.log("  " + ext.map((e) => e.extname).join(", "));
  const hasTrgm = ext.some((e) => e.extname === "pg_trgm");
  console.log(`  pg_trgm kurulu mu? ${hasTrgm ? "EVET" : "HAYIR (arama tam-tarama yapıyor)"}`);

  // 3) Gerçek arama sorgularının planı (ILIKE %term%)
  const like = `%${TERM.replace(/'/g, "''")}%`;
  await explain(
    "tefsir arama (ILIKE) — search route'un yaptığı",
    `SELECT id FROM "TafsirContent" WHERE text ILIKE '${like}' AND "modernizedAt" IS NOT NULL LIMIT 20`
  );
  await explain(
    "meal arama (ILIKE)",
    `SELECT id FROM "Ayah" WHERE meal ILIKE '${like}' LIMIT 20`
  );
  await explain(
    "translation arama (ILIKE)",
    `SELECT id FROM "Translation" WHERE text ILIKE '${like}' LIMIT 20`
  );

  // 4) Okuyucu sayfasının yaptığı sorguların timing'i
  console.log("\n=== Okuyucu sayfası sorgu süreleri (örnek: Bakara 255) ===");
  const sId = 2,
    aNo = 255;
  const ayet = await timed("ayah.findUnique", () =>
    prisma.ayah.findUnique({ where: { surahId_number: { surahId: sId, number: aNo } } })
  );
  await timed("surah.findMany (114 satır)", () =>
    prisma.surah.findMany({ orderBy: { id: "asc" }, select: { id: true, nameTr: true, ayetCount: true } })
  );
  await timed("tafsir.findMany (içeriği olanlar)", () =>
    prisma.tafsir.findMany({
      where: { contents: { some: { ayahId: ayet?.id ?? 0, modernizedAt: { not: null } } } },
      orderBy: { order: "asc" },
    })
  );
  await timed("tafsirContent.count (generateMetadata)", () =>
    prisma.tafsirContent.count({
      where: { ayah: { surahId: sId, number: aNo }, modernizedAt: { not: null } },
    })
  );
  if (ayet) {
    await timed("tafsirContent.findUnique (tek tefsir aç)", () =>
      prisma.tafsirContent.findFirst({
        where: { ayahId: ayet.id, modernizedAt: { not: null } },
        include: { tafsir: true },
      })
    );
  }

  console.log("\n===== bitti =====\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
