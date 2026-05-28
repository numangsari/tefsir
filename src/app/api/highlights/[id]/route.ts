export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { id } = await params;
  const hl = await prisma.highlight.findUnique({ where: { id } });
  if (!hl) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (hl.userId !== userId) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}