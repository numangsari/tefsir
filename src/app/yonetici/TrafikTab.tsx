"use client";

import { useEffect, useState } from "react";
import type { TrafficStats } from "./types";
import { Card, SparkArea, Spinner, StatCard } from "./ui";

export function TrafikTab() {
  const [data, setData] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading && !data) return <Spinner />;
  if (!data) return <Spinner label="Veri alınamadı." />;

  const hasData = data.pageViews.month > 0;

  return (
    <div className="space-y-6">
      {/* Sayfa görüntüleme */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Görüntüleme · bugün" value={data.pageViews.today} />
        <StatCard label="Görüntüleme · 7 gün" value={data.pageViews.week} />
        <StatCard label="Görüntüleme · 30 gün" value={data.pageViews.month} />
      </section>
      {/* Tekil ziyaretçi */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Ziyaretçi · bugün" value={data.visitors.today} />
        <StatCard label="Ziyaretçi · 7 gün" value={data.visitors.week} />
        <StatCard label="Ziyaretçi · 30 gün" value={data.visitors.month} />
      </section>

      {!hasData && (
        <Card>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Henüz ziyaret kaydı yok. Site yayına alınıp ziyaret edildikçe veriler burada birikecek.
            (Yönetici sayfaları sayılmaz.)
          </p>
        </Card>
      )}

      {/* 30 günlük trend */}
      <Card title="Son 30 gün — günlük">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Sayfa görüntüleme</div>
            <SparkArea data={data.daily.map((d) => d.pageViews)} color="sky" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Tekil ziyaretçi</div>
            <SparkArea data={data.daily.map((d) => d.visitors)} color="emerald" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* En çok gezilen sayfalar */}
        <Card title="En çok gezilen sayfalar (30 gün)">
          {data.topPages.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500">Veri yok.</p>
          ) : (
            <ul className="text-sm space-y-1.5">
              {data.topPages.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-2">
                  <span className="truncate text-stone-700 dark:text-stone-300" title={p.path}>
                    {p.path}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 tabular-nums shrink-0">
                    {p.count.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Yönlendirenler */}
        <Card title="Yönlendiren kaynaklar (30 gün)">
          {data.topReferrers.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Doğrudan ziyaretler dışında kaynak yok.
            </p>
          ) : (
            <ul className="text-sm space-y-1.5">
              {data.topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-center justify-between gap-2">
                  <span className="truncate text-stone-700 dark:text-stone-300" title={r.referrer}>
                    {r.referrer}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 tabular-nums shrink-0">
                    {r.count.toLocaleString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-stone-400 dark:text-stone-500">
        Çerezsiz analitik: tekil ziyaretçi günlük bazda hesaplanır (ham IP saklanmaz, anahtar her gün
        değişir). Bu yüzden 7/30 günlük ziyaretçi sayıları üst sınır göstergesidir.
      </p>
    </div>
  );
}
