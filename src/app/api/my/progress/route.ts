export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Kullanıcının sûre bazında okuma ilerlemesi.
// Yüzde = okunan (ayet×tefsir) işaret sayısı / o sûredeki toplam tefsir içeriği sayısı.
// Yalnızca en az bir tefsir okunan ("başlanan") sûreler döner.
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sûre bazında okunan işaret sayısı
  const readRows = await prisma.$queryRaw<{ surahId: number; cnt: number }[]>`
    SELECT a."surahId" AS "surahId", COUNT(*)::int AS cnt
    FROM "TafsirReadMark" trm
    JOIN "Ayah" a ON a.id = trm."ayahId"
    WHERE trm."userId" = ${userId}
    GROUP BY a."surahId"
  `;

  const startedIds = readRows.map((r) => r.surahId);
  if (startedIds.length === 0) {
    return NextResponse.json({ surahs: [] });
  }

  // Bu sûrelerdeki toplam tefsir içeriği (payda) ve sûre adları
  const [totalRows, surahs] = await Promise.all([
    prisma.$queryRaw<{ surahId: number; cnt: number }[]>`
      SELECT a."surahId" AS "surahId", COUNT(*)::int AS cnt
      FROM "TafsirContent" tc
      JOIN "Ayah" a ON a.id = tc."ayahId"
      WHERE a."surahId" IN (${Prisma.join(startedIds)})
        AND tc."modernizedAt" IS NOT NULL
      GROUP BY a."surahId"
    `,
    prisma.surah.findMany({
      where: { id: { in: startedIds } },
      select: { id: true, nameTr: true, ayetCount: true },
    }),
  ]);

  const readMap = new Map(readRows.map((r) => [r.surahId, r.cnt]));
  const totalMap = new Map(totalRows.map((r) => [r.surahId, r.cnt]));

  const result = surahs
    .map((s) => {
      const read = readMap.get(s.id) ?? 0;
      const total = totalMap.get(s.id) ?? 0;
      const percent = total > 0 ? Math.round((read / total) * 100) : 0;
      return {
        surahId: s.id,
        nameTr: s.nameTr,
        ayetCount: s.ayetCount,
        read,
        total,
        percent,
      };
    })
    // En çok okunandan aza sırala (yüzde, sonra okunan sayı)
    .sort((a, b) => b.percent - a.percent || b.read - a.read || a.surahId - b.surahId);

  return NextResponse.json({ surahs: result });
}
