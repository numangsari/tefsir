/**
 * SQLite dev.db → Neon PostgreSQL migration
 * Çalıştır: npx tsx scripts/migrate-to-neon.ts
 */
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";

const SQLITE_PATH = path.join(process.cwd(), "prisma", "dev.db");
const BATCH = 200;

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const prisma = new PrismaClient();

function log(msg: string) {
  console.log(`[${new Date().toISOString().substring(11, 19)}] ${msg}`);
}

async function migrateSurahs() {
  const rows = sqlite.prepare("SELECT * FROM Surah ORDER BY id").all() as any[];
  log(`Surah: ${rows.length} kayıt`);
  for (const r of rows) {
    await prisma.surah.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        nameTr: r.nameTr,
        nameTrSlug: r.nameTrSlug,
        nameAr: r.nameAr,
        ayetCount: r.ayetCount,
        revelationType: r.revelationType ?? null,
        revelationOrder: r.revelationOrder ?? null,
        meaning: r.meaning ?? null,
      },
      update: {
        nameTr: r.nameTr,
        nameTrSlug: r.nameTrSlug,
        nameAr: r.nameAr,
        ayetCount: r.ayetCount,
        revelationType: r.revelationType ?? null,
        revelationOrder: r.revelationOrder ?? null,
        meaning: r.meaning ?? null,
      },
    });
  }
  log("Surah: tamamlandı");
}

async function migrateTafsirs() {
  const rows = sqlite.prepare("SELECT * FROM Tafsir ORDER BY id").all() as any[];
  log(`Tafsir: ${rows.length} kayıt`);
  for (const r of rows) {
    await prisma.tafsir.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        code: r.code,
        name: r.name,
        author: r.author ?? null,
        slug: r.slug,
        order: r.order,
        deathYearHijri: r.deathYearHijri ?? null,
        deathYearGregorian: r.deathYearGregorian ?? null,
      },
      update: {
        code: r.code,
        name: r.name,
        author: r.author ?? null,
        slug: r.slug,
        order: r.order,
        deathYearHijri: r.deathYearHijri ?? null,
        deathYearGregorian: r.deathYearGregorian ?? null,
      },
    });
  }
  log("Tafsir: tamamlandı");
}

async function migrateAyahs() {
  const total = (sqlite.prepare("SELECT COUNT(*) as c FROM Ayah").get() as any).c;
  log(`Ayah: ${total} kayıt, batch=${BATCH}`);
  let offset = 0;
  let done = 0;
  while (offset < total) {
    const rows = sqlite
      .prepare("SELECT * FROM Ayah ORDER BY id LIMIT ? OFFSET ?")
      .all(BATCH, offset) as any[];
    await prisma.$transaction(
      rows.map((r) =>
        prisma.ayah.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            surahId: r.surahId,
            number: r.number,
            arabic: r.arabic,
            meal: r.meal,
          },
          update: {
            arabic: r.arabic,
            meal: r.meal,
          },
        })
      )
    );
    done += rows.length;
    offset += BATCH;
    if (done % 1000 === 0 || done === total) log(`  Ayah: ${done}/${total}`);
  }
  log("Ayah: tamamlandı");
}

async function migrateTranslationEditions() {
  const rows = sqlite.prepare("SELECT * FROM TranslationEdition").all() as any[];
  log(`TranslationEdition: ${rows.length} kayıt`);
  for (const r of rows) {
    await prisma.translationEdition.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        code: r.code,
        name: r.name,
        language: r.language,
        isDefault: r.isDefault === 1 || r.isDefault === true,
      },
      update: {
        code: r.code,
        name: r.name,
        language: r.language,
        isDefault: r.isDefault === 1 || r.isDefault === true,
      },
    });
  }
  log("TranslationEdition: tamamlandı");
}

async function migrateTranslations() {
  const total = (sqlite.prepare("SELECT COUNT(*) as c FROM Translation").get() as any).c;
  log(`Translation: ${total} kayıt, batch=${BATCH}`);
  let offset = 0;
  let done = 0;
  while (offset < total) {
    const rows = sqlite
      .prepare("SELECT * FROM Translation ORDER BY id LIMIT ? OFFSET ?")
      .all(BATCH, offset) as any[];
    await prisma.$transaction(
      rows.map((r) =>
        prisma.translation.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            editionId: r.editionId,
            ayahId: r.ayahId,
            text: r.text,
          },
          update: { text: r.text },
        })
      )
    );
    done += rows.length;
    offset += BATCH;
    if (done % 5000 === 0 || done === total) log(`  Translation: ${done}/${total}`);
  }
  log("Translation: tamamlandı");
}

async function migrateTafsirContents() {
  const total = (sqlite.prepare("SELECT COUNT(*) as c FROM TafsirContent").get() as any).c;
  log(`TafsirContent: ${total} kayıt, batch=${BATCH}`);
  let offset = 0;
  let done = 0;
  while (offset < total) {
    const rows = sqlite
      .prepare("SELECT * FROM TafsirContent ORDER BY id LIMIT ? OFFSET ?")
      .all(BATCH, offset) as any[];
    await prisma.$transaction(
      rows.map((r) =>
        prisma.tafsirContent.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            tafsirId: r.tafsirId,
            ayahId: r.ayahId,
            html: r.html ?? "",
            text: r.text ?? "",
            charCount: r.charCount ?? 0,
            originalHtml: r.originalHtml ?? "",
            originalText: r.originalText ?? "",
            modernizedAt: r.modernizedAt ? new Date(r.modernizedAt) : null,
            modernizedBy: r.modernizedBy ?? null,
            fetchedAt: r.fetchedAt ? new Date(r.fetchedAt) : new Date(),
          },
          update: {
            html: r.html ?? "",
            text: r.text ?? "",
            charCount: r.charCount ?? 0,
            originalHtml: r.originalHtml ?? "",
            originalText: r.originalText ?? "",
            modernizedAt: r.modernizedAt ? new Date(r.modernizedAt) : null,
            modernizedBy: r.modernizedBy ?? null,
          },
        })
      )
    );
    done += rows.length;
    offset += BATCH;
    if (done % 1000 === 0 || done === total)
      log(`  TafsirContent: ${done}/${total}`);
  }
  log("TafsirContent: tamamlandı");
}

async function main() {
  log("=== SQLite → Neon Migration başladı ===");
  log(`Kaynak: ${SQLITE_PATH}`);

  await migrateSurahs();
  await migrateTafsirs();
  await migrateAyahs();
  await migrateTranslationEditions();
  await migrateTranslations();
  await migrateTafsirContents();

  log("=== Migration tamamlandı ===");
}

main()
  .catch((e) => {
    console.error("HATA:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
