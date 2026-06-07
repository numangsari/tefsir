"use client";

import { useEffect, useState } from "react";

type Item = {
  kind: "highlight" | "note";
  id: string;
  tafsirId: number;
  tafsirName: string;
  text: string; // highlight için snippet, note için body
  anchorText?: string; // sadece note
  color?: string;
  createdAt: string;
};

export function NotesPanel({
  ayahNo,
  ayahId,
  surahName,
  hiddenNoteIds,
  onToggleNoteHidden,
  onJump,
}: {
  surahId: number;
  ayahNo: number;
  ayahId: number;
  surahName: string;
  hiddenNoteIds: Set<string>;
  onToggleNoteHidden: (id: string) => void;
  onJump: (tafsirId: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/my/ayah/${ayahId}`);
      if (!r.ok) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const data = (await r.json()) as Item[];
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ayahId]);

  if (loading) return <div className="text-stone-500 dark:text-stone-400">Yükleniyor...</div>;
  if (items.length === 0) {
    return (
      <div className="text-stone-600 dark:text-stone-400">
        <h3 className="text-lg font-semibold mb-2 text-stone-800 dark:text-stone-100">
          {surahName} {ayahNo}. ayet — Notlarım
        </h3>
        <p>Bu ayet için henüz vurgu veya not bırakmamışsın.</p>
      </div>
    );
  }

  const groups = new Map<number, { name: string; items: Item[] }>();
  for (const it of items) {
    const g = groups.get(it.tafsirId) ?? { name: it.tafsirName, items: [] };
    g.items.push(it);
    groups.set(it.tafsirId, g);
  }

  return (
    <div>
      <h3 className="text-lg font-serif font-semibold mb-4 text-emerald-700 dark:text-emerald-300">
        {surahName} {ayahNo}. ayet — Vurgu ve Notlarım ({items.length})
      </h3>
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([tafsirId, g]) => (
          <section key={tafsirId}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-stone-800 dark:text-stone-100">{g.name}</h4>
              <button
                onClick={() => onJump(tafsirId)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                Tefsire git →
              </button>
            </div>
            <ul className="space-y-2">
              {g.items.map((it) => (
                <li
                  key={`${it.kind}-${it.id}`}
                  className="surface-glass !rounded-xl p-3 text-sm"
                >
                  {it.kind === "highlight" ? (
                    <div>
                      <span className="inline-block w-3 h-3 align-middle rounded-sm mr-2" style={{ backgroundColor: hlBg(it.color) }} />
                      <span className="text-stone-500 dark:text-stone-400 text-xs">Vurgu:</span>{" "}
                      <span className="italic text-stone-800 dark:text-stone-200">&ldquo;{it.text}&rdquo;</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Bağlam: &ldquo;…{it.anchorText}…&rdquo;</div>
                      {hiddenNoteIds.has(it.id) ? (
                        <div className="text-emerald-700 dark:text-emerald-300">✎ (Gizli not)</div>
                      ) : (
                        <div className="whitespace-pre-wrap text-stone-800 dark:text-stone-200">{it.text}</div>
                      )}
                      <button
                        onClick={() => onToggleNoteHidden(it.id)}
                        className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline"
                      >
                        {hiddenNoteIds.has(it.id) ? "Gizlemeyi kaldır" : "Gizle"}
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                    {new Date(it.createdAt).toLocaleString("tr-TR")}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function hlBg(color?: string) {
  switch (color) {
    case "green": return "#a7f3d0";
    case "blue": return "#bfdbfe";
    case "pink": return "#fbcfe8";
    default: return "#fde68a";
  }
}
