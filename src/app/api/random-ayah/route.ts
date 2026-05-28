import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.ayah.count();
  if (count === 0) return NextResponse.json({ error: "Veri yok" }, { status: 404 });
  const skip = Math.floor(Math.random() * count);
  const ayah = await prisma.ayah.findFirst({
    skip,
    include: { surah: { select: { nameTr: true } } },
  });
  if (!ayah) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({
    surahId: ayah.surahId,
    surahName: ayah.surah.nameTr,
    number: ayah.number,
    arabic: ayah.arabic,
    meal: ayah.meal,
  });
}
