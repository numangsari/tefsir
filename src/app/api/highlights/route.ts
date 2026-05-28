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
    startOffset: number;
    endOffset: number;
    color?: string;
    text: string;
  };

  if (
    typeof body.tafsirId !== "number" ||
    typeof body.ayahId !== "number" ||
    typeof body.startOffset !== "number" ||
    typeof body.endOffset !== "number" ||
    body.endOffset <= body.startOffset ||
    !body.text
  ) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const hl = await prisma.highlight.create({
    data: {
      userId,
      tafsirId: body.tafsirId,
      ayahId: body.ayahId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      color: "green",
      text: body.text,
    },
  });

  return NextResponse.json(hl);
}
