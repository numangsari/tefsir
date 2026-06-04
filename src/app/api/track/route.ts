import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|preview|monitor|headless/i;

// Günlük tuzlu, çerezsiz ziyaretçi anahtarı: ham IP saklanmaz, anahtar her gün değişir.
function dailyVisitorKey(ip: string, ua: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.NEXTAUTH_SECRET ?? "tefsirnet";
  return createHash("sha256")
    .update(`${day}|${salt}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}

function detectDevice(ua: string): string {
  return /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua) ? "mobile" : "desktop";
}

// Yönlendiren URL'sini host'a indirger; kendi domain'imizden gelenler "iç gezinme" → null.
function referrerHost(raw: unknown, selfHost: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname;
    if (selfHost && host === selfHost) return null;
    return host.slice(0, 128);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  // Bot/önizleme istekleri ve UA'sız istekler sayılmaz
  if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const path = typeof body.path === "string" ? body.path : "";
  // Yalnızca uygulama içi yollar (keyfi string/host enjeksiyonunu engelle)
  if (!path.startsWith("/") || path.length > 512) {
    return new NextResponse(null, { status: 204 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const selfHost = req.headers.get("host")?.split(":")[0] ?? null;

  try {
    await prisma.pageView.create({
      data: {
        path,
        referrer: referrerHost(body.referrer, selfHost),
        visitorKey: dailyVisitorKey(ip, ua),
        country,
        device: detectDevice(ua),
      },
    });
  } catch {
    // Analitik kaydı kritik değil — hata sessizce yutulur, kullanıcı akışı bozulmaz
  }

  return new NextResponse(null, { status: 204 });
}
