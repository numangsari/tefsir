export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ surah: string; ayah: string; tafsirId: string }> }
) {
  const { surah, ayah, tafsirId } = await params;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  const tId = parseInt(tafsirId);

  const ayet = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId: sId, number: aNo } },
  });
  if (!ayet) return NextResponse.json({ error: "Ayet bulunamadı" }, { status: 404 });

  const content = await prisma.tafsirContent.findUnique({
    where: { tafsirId_ayahId: { tafsirId: tId, ayahId: ayet.id } },
    include: { tafsir: true },
  });
  if (!content) return NextResponse.json({ error: "Tefsir bulunamadı" }, { status: 404 });

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [highlights, notes] = userId
    ? await Promise.all([
        prisma.highlight.findMany({
          where: { userId, tafsirId: tId, ayahId: ayet.id },
          orderBy: { startOffset: "asc" },
        }),
        prisma.note.findMany({
          where: { userId, tafsirId: tId, ayahId: ayet.id },
          orderBy: { position: "asc" },
        }),
      ])
    : [[], []];

  return NextResponse.json({
    tafsir: {
      id: content.tafsirId,
      code: content.tafsir.code,
      name: content.tafsir.name,
    },
    text: content.text,
    html: content.html,
    originalText: content.originalText || null,
    originalHtml: content.originalHtml || null,
    modernizedAt: content.modernizedAt?.toISOString() ?? null,
    modernizedBy: content.modernizedBy ?? null,
    highlights,
    notes,
  });
}