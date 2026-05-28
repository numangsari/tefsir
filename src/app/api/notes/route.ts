export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const body = (await req.json()) as {
    tafsirId: number;
    ayahId: number;
    position: number;
    anchorText: string;
    body: string;
  };

  if (
    typeof body.tafsirId !== "number" ||
    typeof body.ayahId !== "number" ||
    typeof body.position !== "number" ||
    !body.body?.trim()
  ) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      userId,
      tafsirId: body.tafsirId,
      ayahId: body.ayahId,
      position: body.position,
      anchorText: body.anchorText ?? "",
      body: body.body.trim(),
    },
  });

  return NextResponse.json(note);
}