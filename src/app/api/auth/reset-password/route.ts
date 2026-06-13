export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePasswordAgainstEmail } from "@/lib/password-policy";

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json()) as {
    token?: string;
    password?: string;
  };

  if (!token || !password) {
    return NextResponse.json({ error: "Token ve yeni şifre zorunlu." }, { status: 400 });
  }
  const record = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: { select: { email: true } } },
  });

  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Bu bağlantı geçersiz veya süresi dolmuş." },
      { status: 400 }
    );
  }

  const passwordCheck = validatePasswordAgainstEmail(password, record.user.email);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}