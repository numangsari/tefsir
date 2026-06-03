import "./load-env";
import { prisma } from "../src/lib/prisma";

async function main() {
  const term = process.argv[2] ?? "";
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      role: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
