import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GROWTH_DAYS = 30;

// Bir tablonun son N gün için günlük yeni-kayıt sayısını döndürür.
// Tablo adları Prisma'nın varsayılan (PascalCase) eşlemesiyle birebir.
async function dailyCounts(
  table: "User" | "Note" | "Highlight",
  since: Date
): Promise<Map<string, number>> {
  const rows = await prisma.$queryRawUnsafe<{ day: Date; c: bigint }[]>(
    `SELECT date_trunc('day', "createdAt") AS day, count(*) AS c
     FROM "${table}"
     WHERE "createdAt" >= $1
     GROUP BY day`,
    since
  );
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = new Date(r.day).toISOString().slice(0, 10);
    map.set(key, Number(r.c));
  }
  return map;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (GROWTH_DAYS - 1));

  const [
    userCount,
    verifiedUserCount,
    highlightCount,
    noteCount,
    readMarkCount,
    tafsirContentCount,
    modernizedCount,
    ayahCount,
    tafsirCount,
    userDaily,
    noteDaily,
    highlightDaily,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.highlight.count(),
    prisma.note.count(),
    prisma.tafsirReadMark.count(),
    prisma.tafsirContent.count(),
    prisma.tafsirContent.count({ where: { modernizedAt: { not: null } } }),
    prisma.ayah.count(),
    prisma.tafsir.count(),
    dailyCounts("User", since),
    dailyCounts("Note", since),
    dailyCounts("Highlight", since),
  ]);

  // Son GROWTH_DAYS günü, eksik günler 0 olacak şekilde diziye çevir
  const growth = Array.from({ length: GROWTH_DAYS }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      date: key,
      users: userDaily.get(key) ?? 0,
      notes: noteDaily.get(key) ?? 0,
      highlights: highlightDaily.get(key) ?? 0,
    };
  });

  // En aktif 5 kullanıcı (highlight + note toplamı)
  const top = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      _count: { select: { highlights: true, notes: true } },
    },
  });
  const topUsers = top
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      total: u._count.highlights + u._count.notes,
      highlights: u._count.highlights,
      notes: u._count.notes,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return NextResponse.json({
    userCount,
    verifiedUserCount,
    highlightCount,
    noteCount,
    readMarkCount,
    tafsirContentCount,
    modernizedCount,
    ayahCount,
    expectedTafsirContent: tafsirCount * ayahCount,
    topUsers,
    growth,
  });
}
