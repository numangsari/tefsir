// Tefsirsitesi.com'dan 11 Türkçe tefsiri ayet ayet çeker
// Argümanlar (opsiyonel): --surah=1 veya --tafsir=T001 sınırlamak için
// Argüman yoksa hepsi (~81k istek)
import { PrismaClient } from "@prisma/client";
import pLimit from "p-limit";
import { extractTafsirBody, fetchAndDecode, tafsirUrl } from "../src/lib/scrape-utils";

const prisma = new PrismaClient();

const CONCURRENCY = 12;
const RETRY = 3;

async function fetchOne(tafsirCode: string, surahId: number, ayahNo: number) {
  const url = tafsirUrl(tafsirCode, surahId, ayahNo);
  let lastErr: unknown;
  for (let i = 0; i < RETRY; i++) {
    try {
      const html = await fetchAndDecode(url, "windows-1254");
      const body = extractTafsirBody(html);
      return body;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { surah?: number; tafsir?: string; from?: number; to?: number } = {};
  for (const a of args) {
    const [k, v] = a.replace(/^--/, "").split("=");
    if (k === "surah") out.surah = parseInt(v);
    else if (k === "tafsir") out.tafsir = v;
    else if (k === "from") out.from = parseInt(v);
    else if (k === "to") out.to = parseInt(v);
  }
  return out;
}

async function main() {
  const args = parseArgs();

  const tafsirs = await prisma.tafsir.findMany({
    where: args.tafsir ? { code: args.tafsir } : undefined,
    orderBy: { order: "asc" },
  });
  const surahs = await prisma.surah.findMany({
    where: args.surah
      ? { id: args.surah }
      : args.from || args.to
      ? { id: { gte: args.from ?? 1, lte: args.to ?? 114 } }
      : undefined,
    orderBy: { id: "asc" },
  });

  console.log(
    `${tafsirs.length} tefsir x ${surahs.length} sure işlenecek ` +
      `(${surahs.reduce((s, x) => s + x.ayetCount, 0)} ayet)`
  );

  const limit = pLimit(CONCURRENCY);
  let done = 0;
  let failed = 0;
  const startedAt = Date.now();

  const total = tafsirs.length * surahs.reduce((s, x) => s + x.ayetCount, 0);

  // Önce mevcut içerikleri sayım için
  for (const t of tafsirs) {
    for (const s of surahs) {
      const ayahs = await prisma.ayah.findMany({
        where: { surahId: s.id },
        select: { id: true, number: true },
        orderBy: { number: "asc" },
      });

      // Mevcut içerikleri bul
      const existing = await prisma.tafsirContent.findMany({
        where: { tafsirId: t.id, ayahId: { in: ayahs.map((a) => a.id) } },
        select: { ayahId: true },
      });
      const haveSet = new Set(existing.map((e) => e.ayahId));

      const tasks = ayahs
        .filter((a) => !haveSet.has(a.id))
        .map((a) =>
          limit(async () => {
            try {
              const body = await fetchOne(t.code, s.id, a.number);
              await prisma.tafsirContent.upsert({
                where: { tafsirId_ayahId: { tafsirId: t.id, ayahId: a.id } },
                create: {
                  tafsirId: t.id,
                  ayahId: a.id,
                  html: body.html,
                  text: body.text,
                  charCount: body.text.length,
                },
                update: {
                  html: body.html,
                  text: body.text,
                  charCount: body.text.length,
                },
              });
              done++;
              if (done % 50 === 0) {
                const elapsed = (Date.now() - startedAt) / 1000;
                const rate = done / elapsed;
                const eta = (total - done) / rate;
                process.stdout.write(
                  `\r[${t.code}] ${done}/${total} (${rate.toFixed(1)}/s, ETA ${(eta / 60).toFixed(
                    1
                  )} dk, hata ${failed})    `
                );
              }
            } catch (e) {
              failed++;
              console.error(
                `\nHATA: ${t.code} ${s.id}/${a.number}:`,
                e instanceof Error ? e.message : e
              );
            }
          })
        );
      done += haveSet.size;
      await Promise.all(tasks);
    }
    console.log(`\n${t.code} (${t.name}) tamamlandı`);
  }

  console.log(
    `\nBitti. Başarılı: ${done - failed}, Hata: ${failed}, Süre: ${(
      (Date.now() - startedAt) /
      1000 /
      60
    ).toFixed(1)} dk`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
