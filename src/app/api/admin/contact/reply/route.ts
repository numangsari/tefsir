import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sendContactReply } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Admin = { id?: string; email?: string; role?: string };

// Yönetici panelinden bir iletişim mesajına yanıt gönderir (site adına, Resend ile).
export async function POST(req: NextRequest) {
  const session = await auth();
  const admin = session?.user as Admin | undefined;
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  }

  let raw: { id?: unknown; body?: unknown };
  try {
    raw = (await req.json()) as { id?: unknown; body?: unknown };
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const id = typeof raw.id === "string" ? raw.id : "";
  const replyBody = typeof raw.body === "string" ? raw.body.trim().slice(0, 5000) : "";
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  if (replyBody.length < 2) {
    return NextResponse.json({ error: "Yanıt metni boş olamaz." }, { status: 400 });
  }

  const msg = await prisma.contactMessage.findUnique({
    where: { id },
    select: { email: true, subject: true, body: true },
  });
  if (!msg) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });

  try {
    await sendContactReply({
      to: msg.email,
      subject: msg.subject,
      replyBody,
      originalBody: msg.body,
    });
  } catch (err) {
    console.error("İletişim yanıtı gönderilemedi:", err);
    return NextResponse.json(
      { error: "Yanıt e-postası gönderilemedi." },
      { status: 502 }
    );
  }

  // Yanıtlanan mesajı okundu say
  await prisma.contactMessage.update({
    where: { id },
    data: { readAt: new Date() },
  });

  await recordAudit({
    actorId: admin.id ?? null,
    actorEmail: admin.email ?? "?",
    action: "contact.reply",
    targetType: "contact",
    targetId: id,
    targetLabel: msg.email,
  });

  return NextResponse.json({ ok: true });
}
