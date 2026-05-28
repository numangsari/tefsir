export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ surah: string; ayah: string }> }
) {
  const { surah, ayah } = await params;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  if (Number.isNaN(sId) || Number.isNaN(aNo)) {
    return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });
  }

  const ayet = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId: sId, number: aNo } },
    include: { surah: true },
  });
  if (!ayet) return NextResponse.json({ error: "Ayet bulunamadı" }, { status: 404 });

  // Bu ayet için tüm tefsir özetleri (uzunluk dahil)
  const contents = await prisma.tafsirContent.findMany({
    where: { ayahId: ayet.id },
    include: { tafsir: true },
    orderBy: { tafsir: { order: "asc" } },
  });

  return NextResponse.json({
    ayah: {
      id: ayet.id,
      surahId: ayet.surahId,
      number: ayet.number,
      arabic: ayet.arabic,
      meal: ayet.meal,
      surahNameTr: ayet.surah.nameTr,
      surahNameAr: ayet.surah.nameAr,
      ayetCount: ayet.surah.ayetCount,
    },
    tafsirs: contents.map((c) => ({
      tafsirId: c.tafsirId,
      tafsirCode: c.tafsir.code,
      tafsirName: c.tafsir.name,
      tafsirSlug: c.tafsir.slug,
      tafsirOrder: c.tafsir.order,
      charCount: c.charCount,
    })),
  });
}