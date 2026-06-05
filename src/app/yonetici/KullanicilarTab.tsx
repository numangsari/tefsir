"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toaster";
import type { User } from "./types";
import { Card } from "./ui";

type RoleFilter = "all" | "USER" | "ADMIN";
type VerifyFilter = "all" | "verified" | "pending";
type SortKey = "recent" | "oldest" | "activity";

const PAGE_SIZE = 20;

export function KullanicilarTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [verifyFilter, setVerifyFilter] = useState<VerifyFilter>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(0);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    // Silinmişler de gelsin; gösterimi client tarafında filtreleriz
    const res = await fetch("/api/admin/users?includeDeleted=1", { cache: "no-store" });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [q, roleFilter, verifyFilter, showDeleted, sort]);

  async function setRole(id: string, role: "USER" | "ADMIN") {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (r.ok) {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
      toast.success(`Rol "${role}" olarak güncellendi.`);
    } else toast.error("Rol güncellenemedi.");
  }

  async function verify(id: string, email: string) {
    const ok = await toast.confirm(
      `'${email}' kullanıcısının e-postası manuel olarak doğrulanmış işaretlensin mi?`
    );
    if (!ok) return;
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailVerified: true }),
    });
    if (r.ok) {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, emailVerified: true } : u)));
      toast.success("E-posta doğrulandı.");
    } else toast.error("Doğrulanamadı.");
  }

  // Soft delete — veri korunur, geri yüklenebilir
  async function softDelete(id: string, email: string) {
    const ok = await toast.confirm(
      `'${email}' kullanıcısı silinsin mi? (Veriler korunur, geri yüklenebilir.)`
    );
    if (!ok) return;
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (r.ok) {
      const now = new Date().toISOString();
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, deletedAt: now } : u)));
      toast.success("Kullanıcı silindi (geri yüklenebilir).");
    } else {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || "Silinemedi.");
    }
  }

  async function restore(id: string, email: string) {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (r.ok) {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, deletedAt: null } : u)));
      toast.success(`'${email}' geri yüklendi.`);
    } else toast.error("Geri yüklenemedi.");
  }

  // Kalıcı sil — geri alınamaz hard delete
  async function hardDelete(id: string, email: string) {
    const ok = await toast.confirm(
      `'${email}' KALICI olarak silinsin mi? Bu işlem geri ALINAMAZ; tüm not/vurguları da silinir.`
    );
    if (!ok) return;
    const r = await fetch(`/api/admin/users/${id}?permanent=1`, { method: "DELETE" });
    if (r.ok) {
      setUsers((us) => us.filter((u) => u.id !== id));
      toast.success("Kullanıcı kalıcı olarak silindi.");
    } else {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || "Silinemedi.");
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = users.filter((u) => {
      if (!showDeleted && u.deletedAt) return false;
      if (needle && !u.email.toLowerCase().includes(needle) && !(u.name ?? "").toLowerCase().includes(needle))
        return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (verifyFilter === "verified" && !u.emailVerified) return false;
      if (verifyFilter === "pending" && u.emailVerified) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "activity")
        return b.highlightCount + b.noteCount - (a.highlightCount + a.noteCount);
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });
    return list;
  }, [users, q, roleFilter, verifyFilter, showDeleted, sort]);

  const deletedCount = useMemo(() => users.filter((u) => u.deletedAt).length, [users]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = page > pageCount - 1 ? pageCount - 1 : page;
  const pageRows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Kullanıcılar ({loading ? "..." : filtered.length})
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="E-posta veya isim ara..."
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <Select label="Rol" value={roleFilter} onChange={(v) => setRoleFilter(v as RoleFilter)}
          options={[["all", "Tüm roller"], ["USER", "USER"], ["ADMIN", "ADMIN"]]} />
        <Select label="Durum" value={verifyFilter} onChange={(v) => setVerifyFilter(v as VerifyFilter)}
          options={[["all", "Tüm durumlar"], ["verified", "Doğrulanmış"], ["pending", "Bekleyen"]]} />
        <Select label="Sırala" value={sort} onChange={(v) => setSort(v as SortKey)}
          options={[["recent", "En yeni"], ["oldest", "En eski"], ["activity", "Aktiflik"]]} />
        <label className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 ml-auto">
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          Silinmişleri göster{deletedCount > 0 ? ` (${deletedCount})` : ""}
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
            <tr>
              <th className="text-left py-2 pr-2">E-posta</th>
              <th className="text-left py-2 pr-2">İsim</th>
              <th className="text-left py-2 pr-2">Rol</th>
              <th className="text-left py-2 pr-2">Durum</th>
              <th className="text-right py-2 pr-2">Vurgu</th>
              <th className="text-right py-2 pr-2">Not</th>
              <th className="text-right py-2 pr-2">Okuma</th>
              <th className="text-left py-2 pr-2">Kayıt</th>
              <th className="text-right py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => {
              const isDeleted = !!u.deletedAt;
              return (
                <tr
                  key={u.id}
                  className={`border-b border-stone-100 dark:border-stone-800 last:border-b-0 ${
                    isDeleted ? "opacity-50" : ""
                  }`}
                >
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">{u.name || "—"}</td>
                  <td className="py-2 pr-2">
                    <select
                      value={u.role}
                      disabled={isDeleted}
                      onChange={(e) => setRole(u.id, e.target.value as "USER" | "ADMIN")}
                      className={`text-xs px-2 py-1 rounded border disabled:cursor-not-allowed ${
                        u.role === "ADMIN"
                          ? "border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
                          : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    {isDeleted ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        🗑 Silinmiş
                      </span>
                    ) : u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ✓ Doğrulanmış
                      </span>
                    ) : (
                      <button
                        onClick={() => verify(u.id, u.email)}
                        title="Manuel doğrula"
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      >
                        ⚠ Bekliyor · doğrula
                      </button>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right">{u.highlightCount}</td>
                  <td className="py-2 pr-2 text-right">{u.noteCount}</td>
                  <td className="py-2 pr-2 text-right">{u.readMarkCount}</td>
                  <td className="py-2 pr-2 text-xs text-stone-500 dark:text-stone-400">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {isDeleted ? (
                      <span className="inline-flex gap-2">
                        <button
                          onClick={() => restore(u.id, u.email)}
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Geri yükle
                        </button>
                        <button
                          onClick={() => hardDelete(u.id, u.email)}
                          className="text-xs text-red-700 dark:text-red-400 hover:underline"
                        >
                          Kalıcı sil
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => softDelete(u.id, u.email)}
                        className="text-xs text-red-700 dark:text-red-400 hover:underline"
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-center text-stone-500 dark:text-stone-400">
                  Eşleşme yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-xs text-stone-500 dark:text-stone-400">
          <span>
            {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 disabled:opacity-40"
            >
              ‹ Önceki
            </button>
            <span className="px-1 py-1">{current + 1} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 disabled:opacity-40"
            >
              Sonraki ›
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
      <span>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
