/**
 * numangsari@gmail.com hesabına ADMIN rolü ata
 * Çalıştır: npx tsx scripts/set-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "numangsari@gmail.com";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: "ADMIN", emailVerified: true },
    });
    console.log(`✓ ${ADMIN_EMAIL} → ADMIN rolü verildi.`);
  } else {
    const hash = await bcrypt.hash("Tefsir2026!", 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Numan Görkem Sarı",
        passwordHash: hash,
        role: "ADMIN",
        emailVerified: true,
      },
    });
    console.log(`✓ ${ADMIN_EMAIL} yeni ADMIN hesabı oluşturuldu.`);
    console.log(`  Geçici şifre: Tefsir2026!`);
    console.log(`  Giriş yaptıktan sonra profilden şifrenizi değiştirin.`);
  }
}

main()
  .catch((e) => { console.error("HATA:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
