export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (note.userId !== userId) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const { body } = (await req.json()) as { body: string };
  if (!body?.trim()) return NextResponse.json({ error: "Boş not" }, { status: 400 });

  const updated = await prisma.note.update({
    where: { id },
    data: { body: body.trim() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (note.userId !== userId) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}