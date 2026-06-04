"use client";

import { useEffect, useMemo, useState } from "react";
import type { Stats } from "./types";
import { Card, ProgressBar, SparkArea, Spinner, StatCard } from "./ui";

// Günlük yeni-kayıt dizisini kümülatif diziye çevirir (0'dan başlayarak).
function cumulative(daily: number[]): number[] {
  let sum = 0;
  return daily.map((d) => (sum += d));
}

export function GenelBakisTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
      setLoading(false);
    })();
  }, []);

  const trends = useMemo(() => {
    if (!stats) return null;
    return {
      users: cumulative(stats.growth.map((g) => g.users)),
      notes: cumulative(stats.growth.map((g) => g.notes)),
      highlights: cumulative(stats.growth.map((g) => g.highlights)),
    };
  }, [stats]);

  if (loading && !stats) return <Spinner />;
  if (!stats) return <Spinner label="Veri alınamadı." />;

  const verifiedPct =
    stats.userCount > 0
      ? Math.round((stats.verifiedUserCount / stats.userCount) * 100)
      : 0;
  const modernizedPct =
    stats.tafsirContentCount > 0
      ? (stats.modernizedCount / stats.tafsirContentCount) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* İstatistik kartları */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Kullanıcı" value={stats.userCount} />
        <StatCard
          label="Doğrulanmış"
          value={stats.verifiedUserCount}
          hint={`%${verifiedPct}`}
        />
        <StatCard label="Vurgu" value={stats.highlightCount} />
        <StatCard label="Not" value={stats.noteCount} />
        <StatCard label="Okuma işareti" value={stats.readMarkCount} />
        <StatCard label="Ayet" value={stats.ayahCount} />
      </section>

      {/* Modernizasyon ilerlemesi */}
      <Card title="Sadeleştirme ilerlemesi (yayında görünür içerik)">
        <ProgressBar
          value={stats.modernizedCount}
          max={stats.tafsirContentCount}
          label="Sadeleştirilmiş tefsir içeriği"
          rightLabel={`${stats.modernizedCount.toLocaleString("tr-TR")} / ${stats.tafsirContentCount.toLocaleString("tr-TR")} (%${modernizedPct.toFixed(1)})`}
          color="emerald"
        />
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
          Yalnızca sadeleştirilmiş içerik son kullanıcıya gösterilir. Beklenen toplam:{" "}
          {stats.expectedTafsirContent.toLocaleString("tr-TR")} (11 tefsir × {stats.ayahCount.toLocaleString("tr-TR")} ayet).
        </p>
      </Card>

      {/* Büyüme trendleri — son 30 gün kümülatif */}
      {trends && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TrendCard
            title="Kullanıcılar"
            total={stats.userCount}
            added={trends.users[trends.users.length - 1] ?? 0}
            data={trends.users}
            color="sky"
          />
          <TrendCard
            title="Notlar"
            total={stats.noteCount}
            added={trends.notes[trends.notes.length - 1] ?? 0}
            data={trends.notes}
            color="amber"
          />
          <TrendCard
            title="Vurgular"
            total={stats.highlightCount}
            added={trends.highlights[trends.highlights.length - 1] ?? 0}
            data={trends.highlights}
            color="emerald"
          />
        </section>
      )}

      {/* En aktif kullanıcılar */}
      {stats.topUsers.length > 0 && (
        <Card title="En aktif kullanıcılar">
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
        </Card>
      )}
    </div>
  );
}

function TrendCard({
  title,
  total,
  added,
  data,
  color,
}: {
  title: string;
  total: number;
  added: number;
  data: number[];
  color: "amber" | "emerald" | "sky";
}) {
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {title}
        </span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {added > 0 ? `+${added.toLocaleString("tr-TR")}` : "—"} / 30g
        </span>
      </div>
      <div className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-2 tabular-nums">
        {total.toLocaleString("tr-TR")}
      </div>
      <SparkArea data={data} color={color} />
    </Card>
  );
}
