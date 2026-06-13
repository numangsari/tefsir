export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { validatePasswordAgainstEmail } from "@/lib/password-policy";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetki yok" }, { status: 401 });

  const { currentPassword, newPassword } = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre zorunlu." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const passwordCheck = validatePasswordAgainstEmail(newPassword, user.email);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "Yeni şifre mevcut şifrenizle aynı olamaz." },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Mevcut şifre yanlış." }, { status: 403 });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  return NextResponse.json({ ok: true });
}