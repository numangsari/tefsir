import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ayahId: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { ayahId } = await params;
  const aId = parseInt(ayahId);
  if (Number.isNaN(aId)) return NextResponse.json({ error: "Geçersiz" }, { status: 400 });

  const [highlights, notes] = await Promise.all([
    prisma.highlight.findMany({
      where: { userId, ayahId: aId },
      include: { tafsir: { select: { name: true, order: true } } },
      orderBy: [{ tafsirId: "asc" }, { startOffset: "asc" }],
    }),
    prisma.note.findMany({
      where: { userId, ayahId: aId },
      include: { tafsir: { select: { name: true, order: true } } },
      orderBy: [{ tafsirId: "asc" }, { position: "asc" }],
    }),
  ]);

  const items = [
    ...highlights.map((h) => ({
      kind: "highlight" as const,
      id: h.id,
      tafsirId: h.tafsirId,
      tafsirName: h.tafsir.name,
      tafsirOrder: h.tafsir.order,
      text: h.text,
      color: h.color,
      createdAt: h.createdAt.toISOString(),
    })),
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id,
      tafsirId: n.tafsirId,
      tafsirName: n.tafsir.name,
      tafsirOrder: n.tafsir.order,
      text: n.body,
      anchorText: n.anchorText,
      createdAt: n.createdAt.toISOString(),
    })),
  ].sort((a, b) => a.tafsirOrder - b.tafsirOrder || a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json(items);
}
