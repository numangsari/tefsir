export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  // Varsayılan: yalnızca aktif kullanıcılar. ?includeDeleted=1 → silinmişler de dahil.
  const includeDeleted = new URL(req.url).searchParams.get("includeDeleted") === "1";

  const users = await prisma.user.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      deletedAt: true,
      _count: { select: { highlights: true, notes: true, tafsirReadMarks: true } },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
      highlightCount: u._count.highlights,
      noteCount: u._count.notes,
      readMarkCount: u._count.tafsirReadMarks,
    }))
  );
}
