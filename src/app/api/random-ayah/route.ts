import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = {
  surahId: number;
  surahName: string;
  number: number;
  arabic: string;
  meal: string;
};

export async function GET() {
  // Giriş ekranındaki dekoratif ayet için kısa-orta uzunlukta bir ayet seç.
  // Çok uzun ayetler (ör. Bakara 282) sol panele sığmayıp kırpılıyordu.
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT a."surahId" AS "surahId",
           s."nameTr"  AS "surahName",
           a."number"  AS "number",
           a."arabic"  AS "arabic",
           a."meal"    AS "meal"
    FROM "Ayah" a
    JOIN "Surah" s ON s."id" = a."surahId"
    WHERE char_length(a."arabic") <= 280
    ORDER BY random()
    LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Veri yok" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
