"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { key: "sm", label: "A−", title: "Küçük", size: "0.95rem", line: "1.7" },
  { key: "md", label: "A", title: "Orta (varsayılan)", size: "1.05rem", line: "1.85" },
  { key: "lg", label: "A+", title: "Büyük", size: "1.18rem", line: "2" },
  { key: "xl", label: "A++", title: "Çok büyük", size: "1.32rem", line: "2.1" },
] as const;
type Key = (typeof STEPS)[number]["key"];

const STORAGE_KEY = "tafsir-font-size";

export function FontSizeControl() {
  const [size, setSize] = useState<Key>("md");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Key | null;
    if (stored && STEPS.some((s) => s.key === stored)) {
      setSize(stored);
      apply(stored);
    } else {
      apply("md");
    }
  }, []);

  function apply(k: Key) {
    const step = STEPS.find((s) => s.key === k)!;
    const root = document.documentElement;
    root.style.setProperty("--tafsir-font-size", step.size);
    root.style.setProperty("--tafsir-line-height", step.line);
  }

  function pick(k: Key) {
    setSize(k);
    apply(k);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, k);
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-0.5">
      {STEPS.map((s) => (
        <button
          key={s.key}
          onClick={() => pick(s.key)}
          title={s.title}
          className={`px-2 py-0.5 text-xs rounded ${
            size === s.key
              ? "bg-emerald-700 text-white"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
