"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  highlightCount: number;
  noteCount: number;
};

type Stats = {
  userCount: number;
  highlightCount: number;
  noteCount: number;
  tafsirContentCount: number;
  ayahCount: number;
  expectedTafsirContent: number;
  topUsers: {
    id: string;
    email: string;
    name: string | null;
    total: number;
    highlights: number;
    notes: number;
  }[];
};

export default function YoneticiPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [uRes, sRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/stats", { cache: "no-store" }),
    ]);
    if (uRes.ok) setUsers(await uRes.json());
    if (sRes.ok) setStats(await sRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
  async function remove(id: string, email: string) {
    const ok = await toast.confirm(
      `'${email}' kullanıcısını ve tüm vurgu/notlarını silmek istiyor musun?`
    );
    if (!ok) return;
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (r.ok) {
      setUsers((us) => us.filter((u) => u.id !== id));
      toast.success("Kullanıcı silindi.");
    } else {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error || "Silinemedi.");
    }
  }

  const filtered = users.filter((u) =>
    !q.trim() ||
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mb-6">
        Yönetici Paneli
      </h1>

      {/* İstatistikler */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Kullanıcı" value={stats?.userCount} />
        <StatCard label="Vurgu" value={stats?.highlightCount} />
        <StatCard label="Not" value={stats?.noteCount} />
        <StatCard label="Ayet" value={stats?.ayahCount} />
        <StatCard
          label="Tefsir içerik"
          value={
            stats
              ? `${stats.tafsirContentCount.toLocaleString("tr-TR")} / ${stats.expectedTafsirContent.toLocaleString("tr-TR")}`
              : undefined
          }
        />
      </section>

      {/* En aktif kullanıcılar */}
      {stats && stats.topUsers.length > 0 && (
        <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 mb-6">
          <h2 className="text-sm font-medium mb-3 text-stone-700 dark:text-stone-300">
            En aktif kullanıcılar
          </h2>
          <ul className="text-sm space-y-1">
            {stats.topUsers.map((u, i) => (
              <li key={u.id} className="flex items-center justify-between">
                <span>
                  {i + 1}. {u.name || u.email}
                </span>
                <span className="text-stone-500 dark:text-stone-400 text-xs">
                  {u.highlights} vurgu, {u.notes} not
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Kullanıcı yönetimi */}
      <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left py-2 pr-2">E-posta</th>
                <th className="text-left py-2 pr-2">İsim</th>
                <th className="text-left py-2 pr-2">Rol</th>
                <th className="text-right py-2 pr-2">Vurgu</th>
                <th className="text-right py-2 pr-2">Not</th>
                <th className="text-left py-2 pr-2">Kayıt</th>
                <th className="text-right py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-stone-100 dark:border-stone-800 last:border-b-0"
                >
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">{u.name || "—"}</td>
                  <td className="py-2 pr-2">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value as "USER" | "ADMIN")}
                      className={`text-xs px-2 py-1 rounded border ${
                        u.role === "ADMIN"
                          ? "border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
                          : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      }`}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2 text-right">{u.highlightCount}</td>
                  <td className="py-2 pr-2 text-right">{u.noteCount}</td>
                  <td className="py-2 pr-2 text-xs text-stone-500 dark:text-stone-400">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => remove(u.id, u.email)}
                      className="text-xs text-red-700 dark:text-red-400 hover:underline"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-stone-500 dark:text-stone-400">
                    Eşleşme yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
      <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</div>
      <div className="text-xl font-semibold text-stone-800 dark:text-stone-100 mt-1">
        {value === undefined ? "…" : typeof value === "number" ? value.toLocaleString("tr-TR") : value}
      </div>
    </div>
  );
}
