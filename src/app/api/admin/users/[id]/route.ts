import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sUser = session?.user as { id?: string; role?: string } | undefined;
  if (sUser?.role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const { id } = await params;
  const { role } = (await req.json()) as { role?: string };
  if (role !== "USER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sUser = session?.user as { id?: string; role?: string } | undefined;
  if (sUser?.role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const { id } = await params;
  if (id === sUser.id) {
    return NextResponse.json(
      { error: "Kendinizi silemezsiniz." },
      { status: 400 }
    );
  }
  // İlişkili veriler User onDelete: Cascade ile silinir
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
