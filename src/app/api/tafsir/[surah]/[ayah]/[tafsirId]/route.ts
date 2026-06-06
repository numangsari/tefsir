export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cleanTafsirText } from "@/lib/clean-tafsir-text";

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
  // Sadece AI ile sadeleştirilmiş tefsirler sitede gösterilir; ham metin DB'de
  // dursa da burada yokmuş gibi 404 döner.
  if (!content || !content.modernizedAt)
    return NextResponse.json({ error: "Tefsir bulunamadı" }, { status: 404 });

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

  // Baş/sondaki ayet numarası işaretini ("(6)" gibi) temizle. Vurgu/notlar DB'de
  // ham metne göre saklandığından, atılan baş kadar (trimStart) sola kaydırılır.
  const { text: cleanText, trimStart } = cleanTafsirText(content.text, aNo);
  const cleanLen = cleanText.length;

  const shiftedHighlights = highlights
    .map((h) => ({
      ...h,
      startOffset: h.startOffset - trimStart,
      endOffset: h.endOffset - trimStart,
    }))
    .filter((h) => h.endOffset > 0 && h.startOffset < cleanLen)
    .map((h) => ({
      ...h,
      startOffset: Math.max(0, h.startOffset),
      endOffset: Math.min(cleanLen, h.endOffset),
    }));

  const shiftedNotes = notes
    .map((n) => ({ ...n, position: n.position - trimStart }))
    .filter((n) => n.position >= 0 && n.position <= cleanLen);

  return NextResponse.json({
    tafsir: {
      id: content.tafsirId,
      code: content.tafsir.code,
      name: content.tafsir.name,
    },
    text: cleanText,
    // Yeni vurgu/not eklerken istemci offset'leri ham koordinata çevirmek için kullanır
    textTrimStart: trimStart,
    modernizedAt: content.modernizedAt?.toISOString() ?? null,
    modernizedBy: content.modernizedBy ?? null,
    highlights: shiftedHighlights,
    notes: shiftedNotes,
  });
}