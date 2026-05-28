"use client";

import { useEffect, useState } from "react";

type Trans = { code: string; name: string; text: string; isDefault: boolean };

const STORAGE_KEY = "preferred-meal";

export function MealSwitcher({
  surahId,
  ayahNo,
  initialMeal,
  compact,
}: {
  surahId: number;
  ayahNo: number;
  initialMeal: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<Trans[]>([]);
  const [code, setCode] = useState<string>("tr.diyanet");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setCode(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/translations/${surahId}/${ayahNo}`, { cache: "no-store" });
        if (r.ok && !cancelled) {
          const d = (await r.json()) as Trans[];
          setItems(d);
          setLoaded(true);
        }
      } catch {
        /* yoksay */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surahId, ayahNo]);

  function pick(c: string) {
    setCode(c);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, c);
  }

  const active = items.find((i) => i.code === code);
  const displayText = active?.text ?? initialMeal;
  const displayName = active?.name ?? "Diyanet İşleri";

  return (
    <div>
      <p
        className={`text-stone-700 dark:text-stone-300 leading-relaxed ${
          compact ? "text-sm" : ""
        }`}
      >
        <span className="text-stone-500 dark:text-stone-400 mr-2 text-xs">[{displayName}]</span>
        {displayText}
      </p>

      {loaded && items.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {items.map((it) => (
            <button
              key={it.code}
              type="button"
              onClick={() => pick(it.code)}
              className={`text-[11px] px-2 py-0.5 rounded border ${
                code === it.code
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
              title={it.name}
            >
              {shortName(it.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function shortName(name: string) {
  return name.split(" ")[0];
}
