import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactNotification } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ham IP saklanmaz; abuse teşhisi için tuzlu hash.
function ipHashOf(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET ?? "tefsirnet";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // IP başına saatte 5 mesaj
  const rl = rateLimit(ip, "contact", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Honeypot: gerçek kullanıcılar bu gizli alanı doldurmaz. Bot doldurursa
  // başarı taklidi yapıp sessizce yok say (botu uyarmamak için).
  if (str(raw.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = str(raw.name, 120);
  const email = str(raw.email, 160);
  const subject = str(raw.subject, 160);
  const body = str(raw.body, 5000);

  if (!name || !email || !body) {
    return NextResponse.json(
      { error: "Ad, e-posta ve mesaj alanları zorunludur." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (body.length < 5) {
    return NextResponse.json({ error: "Mesajınız çok kısa." }, { status: 400 });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      subject: subject || null,
      body,
      userId,
      ipHash: ipHashOf(ip),
    },
  });

  // E-posta bildirimi başarısız olsa bile mesaj DB'ye yazıldı; akışı bozma.
  try {
    await sendContactNotification({ name, email, subject, body });
  } catch (err) {
    console.error("İletişim bildirim e-postası gönderilemedi:", err);
  }

  return NextResponse.json({ ok: true });
}
