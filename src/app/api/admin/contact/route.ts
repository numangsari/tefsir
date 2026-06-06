import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Admin = { id?: string; email?: string; role?: string };

async function requireAdmin(): Promise<Admin | null> {
  const session = await auth();
  const u = session?.user as Admin | undefined;
  return u?.role === "ADMIN" ? u : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const [messages, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        body: true,
        userId: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.contactMessage.count({ where: { readAt: null } }),
  ]);

  return NextResponse.json({
    unread,
    messages: messages.map((m) => ({
      ...m,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// Okundu / okunmadı işaretleme
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  const read = req.nextUrl.searchParams.get("read") !== "0";
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { email: true },
  });
  if (!existing) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });

  await prisma.contactMessage.update({
    where: { id },
    data: { readAt: read ? new Date() : null },
  });

  await recordAudit({
    actorId: admin.id ?? null,
    actorEmail: admin.email ?? "?",
    action: read ? "contact.read" : "contact.unread",
    targetType: "contact",
    targetId: id,
    targetLabel: existing.email,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { email: true },
  });
  if (!existing) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });

  await prisma.contactMessage.delete({ where: { id } });

  await recordAudit({
    actorId: admin.id ?? null,
    actorEmail: admin.email ?? "?",
    action: "contact.delete",
    targetType: "contact",
    targetId: id,
    targetLabel: existing.email,
  });

  return NextResponse.json({ ok: true });
}
