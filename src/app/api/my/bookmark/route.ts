export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — mevcut bookmark + insan-okunabilir bilgi
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bookmarkSurahId: true,
      bookmarkAyahNo: true,
      bookmarkTafsirId: true,
      bookmarkAt: true,
    },
  });
  if (!u || !u.bookmarkSurahId || !u.bookmarkAyahNo) {
    return NextResponse.json({ bookmark: null });
  }
  const surah = await prisma.surah.findUnique({
    where: { id: u.bookmarkSurahId },
    select: { id: true, nameTr: true },
  });
  const tafsir = u.bookmarkTafsirId
    ? await prisma.tafsir.findUnique({
        where: { id: u.bookmarkTafsirId },
        select: { id: true, name: true },
      })
    : null;
  return NextResponse.json({
    bookmark: {
      surahId: u.bookmarkSurahId,
      surahName: surah?.nameTr ?? "?",
      ayahNo: u.bookmarkAyahNo,
      tafsirId: u.bookmarkTafsirId ?? null,
      tafsirName: tafsir?.name ?? null,
      at: u.bookmarkAt?.toISOString() ?? null,
    },
  });
}

// POST — bookmark'ı güncelle
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { surahId, ayahNo, tafsirId } = (await req.json()) as {
    surahId?: number;
    ayahNo?: number;
    tafsirId?: number | null;
  };

  if (typeof surahId !== "number" || typeof ayahNo !== "number") {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      bookmarkSurahId: surahId,
      bookmarkAyahNo: ayahNo,
      bookmarkTafsirId: tafsirId ?? null,
      bookmarkAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}

// DELETE — bookmark'ı temizle
export async function DELETE() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: {
      bookmarkSurahId: null,
      bookmarkAyahNo: null,
      bookmarkTafsirId: null,
      bookmarkAt: null,
    },
  });
  return NextResponse.json({ ok: true });
}