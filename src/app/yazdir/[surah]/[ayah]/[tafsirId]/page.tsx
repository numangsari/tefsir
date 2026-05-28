import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PrintView } from "./PrintView";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ surah: string; ayah: string; tafsirId: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect(`/giris`);

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
  if (!content) notFound();

  const [highlights, notes] = await Promise.all([
    prisma.highlight.findMany({
      where: { userId, tafsirId: tId, ayahId: ayet.id },
      orderBy: { startOffset: "asc" },
    }),
    prisma.note.findMany({
      where: { userId, tafsirId: tId, ayahId: ayet.id },
      orderBy: { position: "asc" },
    }),
  ]);

  return (
    <PrintView
      surahName={ayet.surah.nameTr}
      ayahNumber={ayet.number}
      arabic={ayet.arabic}
      meal={ayet.meal}
      tafsirName={content.tafsir.name}
      text={content.text}
      highlights={highlights.map((h) => ({
        id: h.id,
        startOffset: h.startOffset,
        endOffset: h.endOffset,
        text: h.text,
        color: h.color,
      }))}
      notes={notes.map((n) => ({
        id: n.id,
        position: n.position,
        anchorText: n.anchorText,
        body: n.body,
      }))}
    />
  );
}
