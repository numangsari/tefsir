"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentStats } from "./types";
import { Card, ProgressBar, Spinner, StatCard } from "./ui";

function pct(modernized: number, total: number) {
  return total > 0 ? (modernized / total) * 100 : 0;
}

export function IcerikTab() {
  const [data, setData] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyStarted, setOnlyStarted] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  const surahs = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.bySurah.filter((s) => {
      if (onlyStarted && s.modernized === 0) return false;
      if (needle && !s.nameTr.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, onlyStarted, q]);

  if (loading && !data) return <Spinner />;
  if (!data) return <Spinner label="Veri alınamadı." />;

  const overallPct = pct(data.modernizedContent, data.totalContent);
  const startedSurahs = data.bySurah.filter((s) => s.modernized > 0).length;
  const completedSurahs = data.bySurah.filter(
    (s) => s.total > 0 && s.modernized === s.total
  ).length;

  return (
    <div className="space-y-6">
      {/* Özet */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Toplam içerik" value={data.totalContent} />
        <StatCard
          label="Sadeleştirilmiş"
          value={data.modernizedContent}
          hint={`%${overallPct.toFixed(1)}`}
        />
        <StatCard label="Başlanan sure" value={`${startedSurahs} / 114`} />
        <StatCard label="Tamamlanan sure" value={`${completedSurahs} / 114`} />
      </section>

      <Card title="Genel sadeleştirme oranı">
        <ProgressBar
          value={data.modernizedContent}
          max={data.totalContent}
          rightLabel={`${data.modernizedContent.toLocaleString("tr-TR")} / ${data.totalContent.toLocaleString("tr-TR")} (%${overallPct.toFixed(1)})`}
          color="emerald"
        />
      </Card>

      {/* Tefsir bazında */}
      <Card title="Tefsir bazında kapsam">
        <ul className="space-y-3">
          {data.byTafsir.map((t) => (
            <li key={t.tafsirId}>
              <ProgressBar
                value={t.modernized}
                max={t.total}
                label={`${t.code} · ${t.name}`}
                rightLabel={`${t.modernized.toLocaleString("tr-TR")} / ${t.total.toLocaleString("tr-TR")} (%${pct(t.modernized, t.total).toFixed(1)})`}
                color="sky"
              />
            </li>
          ))}
        </ul>
      </Card>

      {/* Sure bazında */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Sure bazında ilerleme ({surahs.length})
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <input
                type="checkbox"
                checked={onlyStarted}
                onChange={(e) => setOnlyStarted(e.target.checked)}
              />
              Yalnızca başlananlar
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sure ara..."
              className="border rounded px-2 py-1 bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 max-h-96 overflow-y-auto pr-1">
          {surahs.map((s) => (
            <div key={s.surahId} className="flex items-center gap-2">
              <span className="text-xs text-stone-400 dark:text-stone-500 w-7 tabular-nums text-right">
                {s.surahId}
              </span>
              <span className="text-sm text-stone-700 dark:text-stone-300 w-28 truncate">
                {s.nameTr}
              </span>
              <div className="flex-1">
                <ProgressBar
                  value={s.modernized}
                  max={s.total}
                  color={s.total > 0 && s.modernized === s.total ? "emerald" : "amber"}
                />
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400 w-14 text-right tabular-nums">
                %{pct(s.modernized, s.total).toFixed(0)}
              </span>
            </div>
          ))}
          {surahs.length === 0 && (
            <div className="text-sm text-stone-500 dark:text-stone-400 py-4">
              Eşleşme yok.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
