import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cleanTafsirText } from "@/lib/clean-tafsir-text";
import { PrintView } from "./PrintView";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ surah: string; ayah: string; tafsirId: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const { surah, ayah, tafsirId } = await params;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  const tId = parseInt(tafsirId);
  if ([sId, aNo, tId].some(Number.isNaN)) notFound();

  const ayet = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId: sId, number: aNo } },
    include: { surah: true },
  });
  if (!ayet) notFound();

  const content = await prisma.tafsirContent.findUnique({
    where: { tafsirId_ayahId: { tafsirId: tId, ayahId: ayet.id } },
    include: { tafsir: true },
  });
  // Sadece AI ile sadeleştirilmiş tefsirler yazdırılabilir/görüntülenebilir
  if (!content || !content.modernizedAt) notFound();

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

  // Okuyucuyla aynı temizlik: baş/sondaki ayet numarası atılır, offset'ler kaydırılır
  const { text: cleanText, trimStart } = cleanTafsirText(content.text, aNo);
  const cleanLen = cleanText.length;

  return (
    <PrintView
      surahName={ayet.surah.nameTr}
      ayahNumber={ayet.number}
      arabic={ayet.arabic}
      meal={ayet.meal}
      tafsirName={content.tafsir.name}
      text={cleanText}
      highlights={highlights
        .map((h) => ({
          id: h.id,
          startOffset: h.startOffset - trimStart,
          endOffset: h.endOffset - trimStart,
          text: h.text,
          color: h.color,
        }))
        .filter((h) => h.endOffset > 0 && h.startOffset < cleanLen)
        .map((h) => ({
          ...h,
          startOffset: Math.max(0, h.startOffset),
          endOffset: Math.min(cleanLen, h.endOffset),
        }))}
      notes={notes
        .map((n) => ({
          id: n.id,
          position: n.position - trimStart,
          anchorText: n.anchorText,
          body: n.body,
        }))
        .filter((n) => n.position >= 0 && n.position <= cleanLen)}
    />
  );
}
