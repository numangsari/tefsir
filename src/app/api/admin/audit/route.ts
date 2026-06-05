import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      actorEmail: true,
      action: true,
      targetType: true,
      targetId: true,
      targetLabel: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      actorEmail: l.actorEmail,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      targetLabel: l.targetLabel,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    }))
  );
}
