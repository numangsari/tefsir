export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: kendi profil bilgilerim
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { highlights: true, notes: true } },
    },
  });
  if (!u) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    highlightCount: u._count.highlights,
    noteCount: u._count.notes,
  });
}

// PATCH: ismi güncelle
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { name } = (await req.json()) as { name?: string };
  if (typeof name !== "string") {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }
  const trimmed = name.trim();
  await prisma.user.update({
    where: { id: userId },
    data: { name: trimmed || null },
  });
  return NextResponse.json({ ok: true, name: trimmed || null });
}

// DELETE: hesabı sil (parola doğrulamasıyla)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { password } = (await req.json()) as { password?: string };
  if (!password) {
    return NextResponse.json(
      { error: "Şifre onayı zorunlu." },
      { status: 400 }
    );
  }
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Şifre yanlış." }, { status: 403 });
  }
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}