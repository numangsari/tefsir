"use client";

import { useEffect } from "react";

type Hl = {
  id: string;
  surahId: number;
  surahName: string;
  ayahNo: number;
  tafsirName: string;
  text: string;
  color: string;
  createdAt: string;
};
type Nt = {
  id: string;
  surahId: number;
  surahName: string;
  ayahNo: number;
  tafsirName: string;
  anchorText: string;
  body: string;
  createdAt: string;
};

const HL_BG: Record<string, string> = {
  yellow: "#fde68a",
  green: "#a7f3d0",
  blue: "#bfdbfe",
  pink: "#fbcfe8",
};

export function PanelPrintView({
  userName,
  filters,
  highlights,
  notes,
}: {
  userName: string;
  filters: { surahId?: number; tafsirId?: number; kind: string };
  highlights: Hl[];
  notes: Nt[];
}) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  type Row =
    | { kind: "highlight"; h: Hl; sortKey: string }
    | { kind: "note"; n: Nt; sortKey: string };
  const rows: Row[] = [
    ...highlights.map(
      (h): Row => ({ kind: "highlight", h, sortKey: `${h.surahId.toString().padStart(3, "0")}-${h.ayahNo}` })
    ),
    ...notes.map(
      (n): Row => ({ kind: "note", n, sortKey: `${n.surahId.toString().padStart(3, "0")}-${n.ayahNo}` })
    ),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <style jsx global>{`
        @media print { .no-print { display: none !important; } body { background: white !important; color: black !important; } }
        @page { margin: 1.5cm; }
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 text-sm bg-emerald-700 text-white rounded"
        >
          Yazdır / PDF
        </button>
      </div>

      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-semibold">Vurgu ve Notlarım</h1>
        <p className="text-stone-500 text-sm">
          {userName} · {new Date().toLocaleDateString("tr-TR")}
        </p>
        <p className="text-stone-500 text-xs mt-1">
          Filtre: {filters.surahId ? `Sûre ${filters.surahId}` : "Tüm sûreler"} ·{" "}
          {filters.tafsirId ? `Tefsir ${filters.tafsirId}` : "Tüm tefsirler"} · {filters.kind === "highlight" ? "vurgular" : filters.kind === "note" ? "notlar" : "tümü"}
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-stone-600">Filtreye uyan kayıt yok.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) =>
            r.kind === "highlight" ? (
              <li key={`h-${r.h.id}`} className="border rounded p-3">
                <div className="text-xs text-stone-500 mb-1">
                  {r.h.surahName} · {r.h.ayahNo}. ayet — {r.h.tafsirName}
                </div>
                <div className="text-sm flex items-start gap-2">
                  <span
                    className="inline-block w-3 h-3 mt-1 rounded-sm shrink-0"
                    style={{ backgroundColor: HL_BG[r.h.color] ?? HL_BG.yellow }}
                  />
                  <span className="italic">&ldquo;{r.h.text}&rdquo;</span>
                </div>
              </li>
            ) : (
              <li key={`n-${r.n.id}`} className="border rounded p-3">
                <div className="text-xs text-stone-500 mb-1">
                  {r.n.surahName} · {r.n.ayahNo}. ayet — {r.n.tafsirName}
                </div>
                <div className="text-xs italic text-stone-500 mb-1">
                  &ldquo;…{r.n.anchorText}…&rdquo;
                </div>
                <div className="text-sm whitespace-pre-wrap">{r.n.body}</div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
