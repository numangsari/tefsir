export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "E-posta zorunlu." }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Kullanıcı yoksa, zaten doğrulanmışsa veya soft-delete edilmişse aynı yanıtı dön
  if (!user || user.emailVerified || user.deletedAt) {
    return NextResponse.json({ ok: true });
  }

  // Önceki tokenları temizle
  await prisma.emailVerification.deleteMany({ where: { userId: user.id } });

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
    console.error("Doğrulama e-postası yeniden gönderilemedi:", err);
    return NextResponse.json({ ok: true, emailError: true });
  }

  return NextResponse.json({ ok: true, emailError: false });
}
