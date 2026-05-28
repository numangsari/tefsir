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

  const ayet = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId: sId, number: aNo } },
    include: {
      translations: {
        include: { edition: { select: { code: true, name: true, isDefault: true } } },
      },
    },
  });
  if (!ayet) return NextResponse.json({ error: "Ayet bulunamadı" }, { status: 404 });

  return NextResponse.json(
    ayet.translations.map((t) => ({
      code: t.edition.code,
      name: t.edition.name,
      text: t.text,
      isDefault: t.edition.isDefault,
    }))
  );
}