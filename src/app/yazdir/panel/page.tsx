import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PanelPrintView } from "./PanelPrintView";

type Search = {
  surahId?: string;
  tafsirId?: string;
  kind?: string;
};

export default async function PanelPrintPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/giris");

  const sp = await searchParams;
  const surahId = sp.surahId ? parseInt(sp.surahId) : undefined;
  const tafsirId = sp.tafsirId ? parseInt(sp.tafsirId) : undefined;
  const kind = sp.kind ?? "all";

  const baseWhere = {
    userId,
    ...(tafsirId ? { tafsirId } : {}),
    ...(surahId ? { ayah: { surahId } } : {}),
  };

  const [highlights, notes] = await Promise.all([
    kind === "note"
      ? Promise.resolve([])
      : prisma.highlight.findMany({
          where: baseWhere,
          include: {
            tafsir: { select: { name: true, order: true } },
            ayah: { include: { surah: { select: { id: true, nameTr: true } } } },
          },
          orderBy: [{ tafsirId: "asc" }],
        }),
    kind === "highlight"
      ? Promise.resolve([])
      : prisma.note.findMany({
          where: baseWhere,
          include: {
            tafsir: { select: { name: true, order: true } },
            ayah: { include: { surah: { select: { id: true, nameTr: true } } } },
          },
          orderBy: [{ tafsirId: "asc" }],
        }),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <PanelPrintView
      userName={userName}
      filters={{ surahId, tafsirId, kind }}
      highlights={highlights.map((h) => ({
        id: h.id,
        surahId: h.ayah.surahId,
        surahName: h.ayah.surah.nameTr,
        ayahNo: h.ayah.number,
        tafsirName: h.tafsir.name,
        text: h.text,
        color: h.color,
        createdAt: h.createdAt.toISOString(),
      }))}
      notes={notes.map((n) => ({
        id: n.id,
        surahId: n.ayah.surahId,
        surahName: n.ayah.surah.nameTr,
        ayahNo: n.ayah.number,
        tafsirName: n.tafsir.name,
        anchorText: n.anchorText,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
