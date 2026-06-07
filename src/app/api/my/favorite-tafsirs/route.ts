export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function GET() {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favs = await prisma.favoriteTafsir.findMany({
    where: { userId },
    select: { tafsirId: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tafsirIds: favs.map((f) => f.tafsirId) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tafsirId } = (await req.json()) as { tafsirId?: number };
  if (!tafsirId) return NextResponse.json({ error: "tafsirId gerekli" }, { status: 400 });

  await prisma.favoriteTafsir.upsert({
    where: { userId_tafsirId: { userId, tafsirId } },
    create: { userId, tafsirId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tafsirId } = (await req.json()) as { tafsirId?: number };
  if (!tafsirId) return NextResponse.json({ error: "tafsirId gerekli" }, { status: 400 });

  await prisma.favoriteTafsir.deleteMany({ where: { userId, tafsirId } });

  return NextResponse.json({ ok: true });
}
