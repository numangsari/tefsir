import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const editions = await prisma.translationEdition.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, isDefault: true },
  });
  return NextResponse.json(editions);
}
