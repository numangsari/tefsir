import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DAYS = 30;

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setHours(0, 0, 0, 0);
  monthAgo.setDate(monthAgo.getDate() - (DAYS - 1));
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [totals, daily, topPages, topReferrers] = await Promise.all([
    // Tek sorguda 3 aralık için sayfa görüntüleme (pv) + tekil ziyaretçi (uv)
    prisma.$queryRawUnsafe<
      { pv30: bigint; uv30: bigint; pv7: bigint; uv7: bigint; pvt: bigint; uvt: bigint }[]
    >(
      `SELECT
         count(*) AS pv30,
         count(distinct "visitorKey") AS uv30,
         count(*) FILTER (WHERE "createdAt" >= $2) AS pv7,
         count(distinct "visitorKey") FILTER (WHERE "createdAt" >= $2) AS uv7,
         count(*) FILTER (WHERE "createdAt" >= $3) AS pvt,
         count(distinct "visitorKey") FILTER (WHERE "createdAt" >= $3) AS uvt
       FROM "PageView" WHERE "createdAt" >= $1`,
      monthAgo,
      weekAgo,
      todayStart
    ),
    prisma.$queryRawUnsafe<{ day: Date; pv: bigint; uv: bigint }[]>(
      `SELECT date_trunc('day', "createdAt") AS day, count(*) AS pv, count(distinct "visitorKey") AS uv
       FROM "PageView" WHERE "createdAt" >= $1 GROUP BY day`,
      monthAgo
    ),
    prisma.$queryRawUnsafe<{ path: string; c: bigint }[]>(
      `SELECT path, count(*) AS c FROM "PageView" WHERE "createdAt" >= $1
       GROUP BY path ORDER BY c DESC LIMIT 10`,
      monthAgo
    ),
    prisma.$queryRawUnsafe<{ referrer: string; c: bigint }[]>(
      `SELECT referrer, count(*) AS c FROM "PageView"
       WHERE "createdAt" >= $1 AND referrer IS NOT NULL
       GROUP BY referrer ORDER BY c DESC LIMIT 8`,
      monthAgo
    ),
  ]);

  const t = totals[0] ?? {
    pv30: 0n, uv30: 0n, pv7: 0n, uv7: 0n, pvt: 0n, uvt: 0n,
  };

  // Eksik günleri 0 ile doldurarak 30 günlük seri
  const dailyMap = new Map(
    daily.map((r) => [
      new Date(r.day).toISOString().slice(0, 10),
      { pv: Number(r.pv), uv: Number(r.uv) },
    ])
  );
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(monthAgo);
    d.setDate(monthAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const hit = dailyMap.get(key);
    return { date: key, pageViews: hit?.pv ?? 0, visitors: hit?.uv ?? 0 };
  });

  return NextResponse.json({
    pageViews: { today: Number(t.pvt), week: Number(t.pv7), month: Number(t.pv30) },
    visitors: { today: Number(t.uvt), week: Number(t.uv7), month: Number(t.uv30) },
    daily: series,
    topPages: topPages.map((r) => ({ path: r.path, count: Number(r.c) })),
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, count: Number(r.c) })),
  });
}
