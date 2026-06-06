"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "./types";
import { Card, Spinner } from "./ui";

// Aksiyon kodu → okunabilir etiket, ikon ve renk
const ACTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  "user.role_change": { label: "Rol değişti", icon: "⇄", cls: "text-amber-700 dark:text-amber-300" },
  "user.verify": { label: "E-posta doğrulandı", icon: "✓", cls: "text-emerald-700 dark:text-emerald-300" },
  "user.soft_delete": { label: "Silindi", icon: "🗑", cls: "text-red-700 dark:text-red-300" },
  "user.restore": { label: "Geri yüklendi", icon: "↺", cls: "text-emerald-700 dark:text-emerald-300" },
  "user.hard_delete": { label: "Kalıcı silindi", icon: "⚠", cls: "text-red-700 dark:text-red-300" },
  "contact.read": { label: "Mesaj okundu", icon: "✉", cls: "text-emerald-700 dark:text-emerald-300" },
  "contact.unread": { label: "Mesaj okunmadı", icon: "✉", cls: "text-amber-700 dark:text-amber-300" },
  "contact.reply": { label: "Mesaj yanıtlandı", icon: "↩", cls: "text-emerald-700 dark:text-emerald-300" },
  "contact.delete": { label: "Mesaj silindi", icon: "🗑", cls: "text-red-700 dark:text-red-300" },
};

function describeMeta(action: string, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (action === "user.role_change" && m.from && m.to) return `${m.from} → ${m.to}`;
  if (action === "user.verify") return m.emailVerified ? "doğrulandı" : "doğrulama kaldırıldı";
  return null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DenetimTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/audit", { cache: "no-store" });
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading && logs.length === 0) return <Spinner />;

  return (
    <Card title={`İşlem geçmişi (son ${logs.length})`}>
      {logs.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Henüz denetim kaydı yok. Yönetici işlemleri (rol değişimi, doğrulama, silme, geri yükleme)
          burada listelenecek.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {logs.map((l) => {
            const meta = ACTION_META[l.action] ?? {
              label: l.action,
              icon: "•",
              cls: "text-stone-600 dark:text-stone-300",
            };
            const detail = describeMeta(l.action, l.metadata);
            return (
              <li key={l.id} className="py-2.5 flex items-start gap-3 text-sm">
                <span className={`shrink-0 ${meta.cls}`} aria-hidden>
                  {meta.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-stone-800 dark:text-stone-100">
                    <span className={`font-medium ${meta.cls}`}>{meta.label}</span>
                    {" · "}
                    <span className="text-stone-700 dark:text-stone-300">
                      {l.targetLabel || l.targetId}
                    </span>
                    {detail && (
                      <span className="text-stone-500 dark:text-stone-400"> ({detail})</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {l.actorEmail} · {formatTime(l.createdAt)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
