export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?error=invalid_token", req.url));
  }

  const record = await prisma.emailVerification.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/emaili-dogrula?status=expired", req.url));
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerification.delete({ where: { id: record.id } });

  return NextResponse.redirect(new URL("/emaili-dogrula?status=success", req.url));
}