export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function resolveAyahId(surahId: number, ayahNo: number) {
  const ayah = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId, number: ayahNo } },
    select: { id: true },
  });
  return ayah?.id ?? null;
}

/** Bu ayet için okundu işaretli tefsir id listesi */
export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const surahId = parseInt(searchParams.get("surahId") ?? "");
  const ayahNo = parseInt(searchParams.get("ayahNo") ?? "");
  if (Number.isNaN(surahId) || Number.isNaN(ayahNo)) {
    return NextResponse.json({ error: "surahId ve ayahNo gerekli" }, { status: 400 });
  }

  const ayahId = await resolveAyahId(surahId, ayahNo);
  if (!ayahId) return NextResponse.json({ tafsirIds: [] });

  const marks = await prisma.tafsirReadMark.findMany({
    where: { userId, ayahId },
    select: { tafsirId: true },
  });

  return NextResponse.json({ tafsirIds: marks.map((m) => m.tafsirId) });
}

/** Okudum işareti ekle */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { surahId, ayahNo, tafsirId } = (await req.json()) as {
    surahId?: number;
    ayahNo?: number;
    tafsirId?: number;
  };
  if (!surahId || !ayahNo || !tafsirId) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const ayahId = await resolveAyahId(surahId, ayahNo);
  if (!ayahId) return NextResponse.json({ error: "Ayet bulunamadı" }, { status: 404 });

  await prisma.tafsirReadMark.upsert({
    where: { userId_tafsirId_ayahId: { userId, tafsirId, ayahId } },
    create: { userId, tafsirId, ayahId },
    update: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

/** Okudum işaretini kaldır */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { surahId, ayahNo, tafsirId } = (await req.json()) as {
    surahId?: number;
    ayahNo?: number;
    tafsirId?: number;
  };
  if (!surahId || !ayahNo || !tafsirId) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const ayahId = await resolveAyahId(surahId, ayahNo);
  if (!ayahId) return NextResponse.json({ ok: true });

  await prisma.tafsirReadMark.deleteMany({
    where: { userId, tafsirId, ayahId },
  });

  return NextResponse.json({ ok: true });
}