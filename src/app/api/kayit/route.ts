export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { validatePasswordAgainstEmail } from "@/lib/password-policy";

export async function POST(req: NextRequest) {
  const { email, password, name } = (await req.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunlu." }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  // Basit e-posta format doğrulaması
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  const passwordCheck = validatePasswordAgainstEmail(password, normalized);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: normalized, name: name?.trim() || null, passwordHash },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(normalized, token);
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
    // Kayıt başarılı ama mail gönderimi başarısız — kullanıcıya bildiriyoruz
    return NextResponse.json({ ok: true, emailError: true });
  }

  return NextResponse.json({ ok: true, emailError: false });
}