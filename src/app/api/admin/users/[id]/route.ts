export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

type SessionUser = { id?: string; email?: string; role?: string };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sUser = session?.user as SessionUser | undefined;
  if (sUser?.role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as {
    role?: string;
    emailVerified?: boolean;
    restore?: boolean;
  };

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, emailVerified: true, deletedAt: true },
  });
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const actor = { actorId: sUser.id ?? null, actorEmail: sUser.email ?? "bilinmiyor" };

  // Rol değişimi
  if (body.role !== undefined) {
    if (body.role !== "USER" && body.role !== "ADMIN") {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    }
    if (body.role !== target.role) {
      await prisma.user.update({ where: { id }, data: { role: body.role } });
      await recordAudit({
        ...actor,
        action: "user.role_change",
        targetType: "user",
        targetId: id,
        targetLabel: target.email,
        metadata: { from: target.role, to: body.role },
      });
    }
    return NextResponse.json({ id, role: body.role });
  }

  // E-posta doğrulama
  if (body.emailVerified !== undefined) {
    if (typeof body.emailVerified !== "boolean") {
      return NextResponse.json({ error: "Geçersiz doğrulama değeri" }, { status: 400 });
    }
    await prisma.user.update({ where: { id }, data: { emailVerified: body.emailVerified } });
    await recordAudit({
      ...actor,
      action: "user.verify",
      targetType: "user",
      targetId: id,
      targetLabel: target.email,
      metadata: { emailVerified: body.emailVerified },
    });
    return NextResponse.json({ id, emailVerified: body.emailVerified });
  }

  // Geri yükleme (soft delete'i geri al)
  if (body.restore === true) {
    await prisma.user.update({ where: { id }, data: { deletedAt: null } });
    await recordAudit({
      ...actor,
      action: "user.restore",
      targetType: "user",
      targetId: id,
      targetLabel: target.email,
    });
    return NextResponse.json({ id, deletedAt: null });
  }

  return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const sUser = session?.user as SessionUser | undefined;
  if (sUser?.role !== "ADMIN") return NextResponse.json({ error: "Yetki yok" }, { status: 403 });

  const { id } = await params;
  if (id === sUser.id) {
    return NextResponse.json({ error: "Kendinizi silemezsiniz." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, deletedAt: true },
  });
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const actor = { actorId: sUser.id ?? null, actorEmail: sUser.email ?? "bilinmiyor" };
  // ?permanent=1 → kalıcı sil (cascade); aksi halde soft delete
  const permanent = new URL(req.url).searchParams.get("permanent") === "1";

  if (permanent) {
    // İlişkili veriler User onDelete: Cascade ile silinir
    await prisma.user.delete({ where: { id } });
    await recordAudit({
      ...actor,
      action: "user.hard_delete",
      targetType: "user",
      targetId: id,
      targetLabel: target.email,
    });
    return NextResponse.json({ ok: true, permanent: true });
  }

  // Soft delete (idempotent: zaten silinmişse de deletedAt güncellenir)
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  await recordAudit({
    ...actor,
    action: "user.soft_delete",
    targetType: "user",
    targetId: id,
    targetLabel: target.email,
  });
  return NextResponse.json({ ok: true, permanent: false });
}
