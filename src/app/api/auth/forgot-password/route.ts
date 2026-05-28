export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "E-posta zorunlu." }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Kullanıcı yoksa da aynı yanıtı dön — e-posta enumeration'ı önler
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Eski tokenları temizle
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
    },
  });

  try {
    await sendPasswordResetEmail(normalized, token);
  } catch (err) {
    console.error("Şifre sıfırlama maili gönderilemedi:", err);
  }

  return NextResponse.json({ ok: true });
}