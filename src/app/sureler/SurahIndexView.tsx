"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Surah = {
  id: number;
  nameTr: string;
  nameAr: string;
  ayetCount: number;
  revelationType: string | null;
  revelationOrder: number | null;
  meaning: string | null;
};

type SortKey = "mushaf" | "revelation" | "size";

export function SurahIndexView({ surahs }: { surahs: Surah[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "mekki" | "medeni">("all");
  const [sort, setSort] = useState<SortKey>("mushaf");

  const filtered = useMemo(() => {
    const qq = q.trim().toLocaleLowerCase("tr");
    const xs = surahs.filter((s) => {
      if (type !== "all" && s.revelationType !== type) return false;
      if (!qq) return true;
      return (
        s.nameTr.toLocaleLowerCase("tr").includes(qq) ||
        String(s.id).startsWith(qq) ||
        (s.meaning ?? "").toLocaleLowerCase("tr").includes(qq)
      );
    });
    if (sort === "revelation") {
      xs.sort((a, b) => (a.revelationOrder ?? 999) - (b.revelationOrder ?? 999));
    } else if (sort === "size") {
      xs.sort((a, b) => b.ayetCount - a.ayetCount);
    } else {
      xs.sort((a, b) => a.id - b.id);
    }
    return xs;
  }, [surahs, q, type, sort]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
        Sûreler
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
        114 sûre — istediğine tıklayıp ilk ayetinden tefsire başlayabilirsin.
      </p>

      {/* Filtre çubuğu */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sûre adı, numarası veya anlamı ile ara..."
          className="border rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "all" | "mekki" | "medeni")}
          className="border rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        >
          <option value="all">Tümü</option>
          <option value="mekki">Mekkî</option>
          <option value="medeni">Medenî</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
        >
          <option value="mushaf">Mushaf sırası</option>
          <option value="revelation">Nüzul sırası</option>
          <option value="size">Ayet sayısına göre</option>
        </select>
      </section>

      {/* Liste */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((s) => (
          <li key={s.id}>
            <Link
              href={`/oku/${s.id}/1`}
              className="block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-stone-400 text-xs">{s.id}.</div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {s.nameTr}
                  </div>
                  {s.meaning && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {s.meaning}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="arabic text-emerald-700 dark:text-emerald-300 text-xl leading-none">
                    {s.nameAr}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                    {s.ayetCount} ayet
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                {s.revelationType && (
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      s.revelationType === "mekki"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                    }`}
                  >
                    {s.revelationType === "mekki" ? "Mekkî" : "Medenî"}
                  </span>
                )}
                {s.revelationOrder && (
                  <span className="text-stone-500 dark:text-stone-400">
                    Nüzul: {s.revelationOrder}.
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="col-span-full text-center text-stone-500 dark:text-stone-400 py-8 text-sm">
            Eşleşme yok.
          </li>
        )}
      </ul>
    </main>
  );
}
