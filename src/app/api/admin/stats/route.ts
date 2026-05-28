import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const [userCount, highlightCount, noteCount, tafsirContentCount, ayahCount, tafsirCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.highlight.count(),
      prisma.note.count(),
      prisma.tafsirContent.count(),
      prisma.ayah.count(),
      prisma.tafsir.count(),
    ]);

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
    highlightCount,
    noteCount,
    tafsirContentCount,
    ayahCount,
    expectedTafsirContent: tafsirCount * ayahCount,
    topUsers,
  });
}
