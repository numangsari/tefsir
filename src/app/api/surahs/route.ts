import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const surahs = await prisma.surah.findMany({
    orderBy: { id: "asc" },
    select: { id: true, nameTr: true, nameAr: true, ayetCount: true, nameTrSlug: true },
  });
  return NextResponse.json(surahs);
}
