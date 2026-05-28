// Sure ve tefsir kataloğunu DB'ye yükle. Ayet metinleri ve tefsir içerikleri
// scrape adımında yazılır.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SURAHS } from "../src/data/surahs";
import { TAFSIRS } from "../src/data/tafsirs";
import { SURAH_META } from "../src/data/surah-meta";

const prisma = new PrismaClient();

async function main() {
  console.log(`Sureler yükleniyor (${SURAHS.length})...`);
  for (const s of SURAHS) {
    const meta = SURAH_META[s.id];
    await prisma.surah.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        nameTr: s.nameTr,
        nameTrSlug: s.slug,
        nameAr: s.nameAr,
        ayetCount: s.ayetCount,
        revelationType: meta?.revelationType,
        revelationOrder: meta?.revelationOrder,
        meaning: meta?.meaning,
      },
      update: {
        nameTr: s.nameTr,
        nameTrSlug: s.slug,
        nameAr: s.nameAr,
        ayetCount: s.ayetCount,
        revelationType: meta?.revelationType,
        revelationOrder: meta?.revelationOrder,
        meaning: meta?.meaning,
      },
    });
  }

  console.log(`Tefsirler yükleniyor (${TAFSIRS.length})...`);
  for (const t of TAFSIRS) {
    await prisma.tafsir.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        code: t.code,
        name: t.name,
        author: t.author,
        slug: t.slug,
        order: t.order,
        deathYearHijri: t.deathYearHijri,
        deathYearGregorian: t.deathYearGregorian,
      },
      update: {
        code: t.code,
        name: t.name,
        author: t.author,
        slug: t.slug,
        order: t.order,
        deathYearHijri: t.deathYearHijri,
        deathYearGregorian: t.deathYearGregorian,
      },
    });
  }

  console.log("Kullanıcılar (admin + test)...");
  const adminEmail = "admin@tefsir.local";
  const testEmail = "test@tefsir.local";

  const adminHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Yönetici",
      passwordHash: adminHash,
      role: "ADMIN",
    },
    update: { role: "ADMIN" },
  });

  const testHash = await bcrypt.hash("test1234", 10);
  await prisma.user.upsert({
    where: { email: testEmail },
    create: {
      email: testEmail,
      name: "Test Kullanıcı",
      passwordHash: testHash,
      role: "USER",
    },
    update: {},
  });

  console.log(`  admin: ${adminEmail} / admin1234`);
  console.log(`  test : ${testEmail} / test1234`);
  console.log("Tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
