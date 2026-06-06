import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "user.role_change"
  | "user.verify"
  | "user.soft_delete"
  | "user.restore"
  | "user.hard_delete"
  | "contact.read"
  | "contact.unread"
  | "contact.reply"
  | "contact.delete";

// Yönetici işlemini denetim kaydına yazar. Audit kaydı asıl işlemi BOZMAMALI:
// hata olursa sessizce yutulur (işlem yine de başarılı sayılır).
export async function recordAudit(params: {
  actorId?: string | null;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  targetLabel?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetLabel: params.targetLabel ?? null,
        metadata: params.metadata,
      },
    });
  } catch {
    // denetim kaydı kritik değil
  }
}
