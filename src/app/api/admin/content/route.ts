import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// İçerik & modernizasyon kapsamı: tefsir ve sure bazında toplam/sadeleştirilmiş içerik.
// count("modernizedAt") NULL satırları saymaz → sadeleştirilmiş sayısı.
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const [tafsirRows, surahRows, tafsirs, surahs, totalContent, modernizedContent] =
    await Promise.all([
      prisma.$queryRawUnsafe<{ tid: number; total: bigint; modern: bigint }[]>(
        `SELECT "tafsirId" AS tid, count(*) AS total, count("modernizedAt") AS modern
         FROM "TafsirContent" GROUP BY "tafsirId"`
      ),
      prisma.$queryRawUnsafe<{ sid: number; total: bigint; modern: bigint }[]>(
        `SELECT a."surahId" AS sid, count(*) AS total, count(tc."modernizedAt") AS modern
         FROM "TafsirContent" tc JOIN "Ayah" a ON a.id = tc."ayahId"
         GROUP BY a."surahId"`
      ),
      prisma.tafsir.findMany({ select: { id: true, code: true, name: true, order: true } }),
      prisma.surah.findMany({ select: { id: true, nameTr: true } }),
      prisma.tafsirContent.count(),
      prisma.tafsirContent.count({ where: { modernizedAt: { not: null } } }),
    ]);

  const tafsirMap = new Map(tafsirRows.map((r) => [r.tid, r]));
  const byTafsir = [...tafsirs]
    .sort((a, b) => a.order - b.order)
    .map((t) => {
      const row = tafsirMap.get(t.id);
      return {
        tafsirId: t.id,
        code: t.code,
        name: t.name,
        total: row ? Number(row.total) : 0,
        modernized: row ? Number(row.modern) : 0,
      };
    });

  const surahMap = new Map(surahRows.map((r) => [r.sid, r]));
  const bySurah = surahs
    .map((s) => {
      const row = surahMap.get(s.id);
      return {
        surahId: s.id,
        nameTr: s.nameTr,
        total: row ? Number(row.total) : 0,
        modernized: row ? Number(row.modern) : 0,
      };
    })
    .sort((a, b) => a.surahId - b.surahId);

  return NextResponse.json({
    totalContent,
    modernizedContent,
    byTafsir,
    bySurah,
  });
}
