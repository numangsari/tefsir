"use client";

import { useEffect, useMemo } from "react";

type Hl = { id: string; startOffset: number; endOffset: number; text: string; color: string };
type Nt = { id: string; position: number; anchorText: string; body: string };

const COLOR_MAP: Record<string, string> = {
  yellow: "#fde68a",
  green: "#a7f3d0",
  blue: "#bfdbfe",
  pink: "#fbcfe8",
};

function buildSegments(text: string, hls: Hl[], notes: Nt[]) {
  type Ev =
    | { offset: number; kind: "hl-start"; hl: Hl }
    | { offset: number; kind: "hl-end"; hl: Hl }
    | { offset: number; kind: "note"; n: Nt };
  const events: Ev[] = [];
  for (const h of hls) {
    events.push({ offset: h.startOffset, kind: "hl-start", hl: h });
    events.push({ offset: h.endOffset, kind: "hl-end", hl: h });
  }
  for (const n of notes) events.push({ offset: n.position, kind: "note", n });
  events.sort((a, b) => {
    if (a.offset !== b.offset) return a.offset - b.offset;
    const ord = { note: 0, "hl-end": 1, "hl-start": 2 } as const;
    return ord[a.kind] - ord[b.kind];
  });
  type Seg =
    | { kind: "text"; text: string; hl?: Hl }
    | { kind: "note"; index: number; n: Nt };
  const segs: Seg[] = [];
  let cursor = 0;
  let open: Hl | undefined;
  let noteIdx = 0;
  for (const e of events) {
    if (e.offset > cursor) {
      segs.push({ kind: "text", text: text.slice(cursor, e.offset), hl: open });
      cursor = e.offset;
    }
    if (e.kind === "hl-start") open = e.hl;
    else if (e.kind === "hl-end") open = undefined;
    else if (e.kind === "note") segs.push({ kind: "note", index: ++noteIdx, n: e.n });
  }
  if (cursor < text.length) segs.push({ kind: "text", text: text.slice(cursor), hl: open });
  return segs;
}

export function PrintView({
  surahName,
  ayahNumber,
  arabic,
  meal,
  tafsirName,
  text,
  highlights,
  notes,
}: {
  surahName: string;
  ayahNumber: number;
  arabic: string;
  meal: string;
  tafsirName: string;
  text: string;
  highlights: Hl[];
  notes: Nt[];
}) {
  // Sayfa açılır açılmaz yazdır diyaloğunu aç
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  const segments = useMemo(
    () => buildSegments(text, highlights, notes),
    [text, highlights, notes]
  );

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0 print:max-w-none">
      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
        }
        @page { margin: 1.5cm; }
        .arabic { direction: rtl; font-family: "Amiri", "Scheherazade New", serif; font-size: 1.8rem; line-height: 2.8rem; }
        .footnote { font-size: 0.85rem; color: #444; }
      `}</style>

      <div className="no-print mb-4 flex justify-end gap-2">
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 text-sm bg-emerald-700 text-white rounded"
        >
          Yazdır / PDF
        </button>
      </div>

      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-semibold">{surahName} Sûresi · {ayahNumber}. Ayet</h1>
        <p className="text-stone-500 text-sm">{tafsirName}</p>
      </header>

      <section className="mb-6">
        <div className="arabic mb-3">{arabic}</div>
        <p className="text-stone-800 leading-relaxed">
          <span className="text-stone-500 mr-2">[Diyanet Meâli]</span>
          {meal}
        </p>
      </section>

      <article className="leading-8 whitespace-pre-wrap text-[0.98rem]">
        {segments.map((seg, i) => {
          if (seg.kind === "note") {
            return (
              <sup key={`n${i}`} className="text-amber-700 font-semibold">
                [{seg.index}]
              </sup>
            );
          }
          if (seg.hl) {
            return (
              <span key={`t${i}`} style={{ backgroundColor: COLOR_MAP[seg.hl.color] ?? "#fde68a" }}>
                {seg.text}
              </span>
            );
          }
          return <span key={`t${i}`}>{seg.text}</span>;
        })}
      </article>

      {notes.length > 0 && (
        <section className="mt-10 pt-6 border-t">
          <h2 className="font-semibold mb-3">Notlarım</h2>
          <ol className="space-y-3 footnote list-decimal pl-6">
            {notes.map((n) => (
              <li key={n.id}>
                <div className="italic text-stone-500">"…{n.anchorText}…"</div>
                <div className="whitespace-pre-wrap">{n.body}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mt-8 footnote">
          <h2 className="font-semibold mb-2">Vurgularım</h2>
          <ul className="space-y-1 list-disc pl-6">
            {highlights.map((h) => (
              <li key={h.id}>
                <span
                  className="inline-block w-2.5 h-2.5 mr-2 align-middle rounded-sm"
                  style={{ backgroundColor: COLOR_MAP[h.color] ?? "#fde68a" }}
                />
                <span className="italic">"{h.text}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
