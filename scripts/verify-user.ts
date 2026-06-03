import "./load-env";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Kullanım: tsx scripts/verify-user.ts <email>");
    process.exit(1);
  }
  const updated = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: true },
    select: { email: true, name: true, emailVerified: true },
  });
  console.log("Güncellendi:", JSON.stringify(updated, null, 2));
}

main().finally(() => prisma.$disconnect());
