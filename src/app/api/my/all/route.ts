export const dynamic = "force-dynamic";
// Tüm vurgu ve notlar — kullanıcı paneli için
// Query parametreleri: ?surahId=&tafsirId=
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const surahId = searchParams.get("surahId");
  const tafsirId = searchParams.get("tafsirId");

  const ayahFilter = surahId ? { surahId: parseInt(surahId) } : undefined;
  const where = {
    userId,
    ...(tafsirId ? { tafsirId: parseInt(tafsirId) } : {}),
    ...(ayahFilter ? { ayah: ayahFilter } : {}),
  };

  const [highlights, notes] = await Promise.all([
    prisma.highlight.findMany({
      where,
      include: {
        tafsir: { select: { name: true, order: true } },
        ayah: { include: { surah: { select: { id: true, nameTr: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.note.findMany({
      where,
      include: {
        tafsir: { select: { name: true, order: true } },
        ayah: { include: { surah: { select: { id: true, nameTr: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items = [
    ...highlights.map((h) => ({
      kind: "highlight" as const,
      id: h.id,
      tafsirId: h.tafsirId,
      tafsirName: h.tafsir.name,
      surahId: h.ayah.surahId,
      surahName: h.ayah.surah.nameTr,
      ayahNo: h.ayah.number,
      text: h.text,
      color: h.color,
      createdAt: h.createdAt.toISOString(),
    })),
    ...notes.map((n) => ({
      kind: "note" as const,
      id: n.id,
      tafsirId: n.tafsirId,
      tafsirName: n.tafsir.name,
      surahId: n.ayah.surahId,
      surahName: n.ayah.surah.nameTr,
      ayahNo: n.ayah.number,
      text: n.body,
      anchorText: n.anchorText,
      createdAt: n.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json(items);
}