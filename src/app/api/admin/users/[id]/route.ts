export const dynamic = "force-dynamic";
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
  const body = (await req.json()) as { role?: string; emailVerified?: boolean };

  // Rol veya e-posta doğrulama durumu güncellenebilir
  const data: { role?: "USER" | "ADMIN"; emailVerified?: boolean } = {};

  if (body.role !== undefined) {
    if (body.role !== "USER" && body.role !== "ADMIN") {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    }
    data.role = body.role;
  }
  if (body.emailVerified !== undefined) {
    if (typeof body.emailVerified !== "boolean") {
      return NextResponse.json({ error: "Geçersiz doğrulama değeri" }, { status: 400 });
    }
    data.emailVerified = body.emailVerified;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, role: true, emailVerified: true },
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