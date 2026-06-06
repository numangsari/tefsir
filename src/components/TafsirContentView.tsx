"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Selection as ActiveSelection } from "./TafsirReader";
import { FontSizeControl } from "./FontSizeControl";

export type Highlight = {
  id: string;
  startOffset: number;
  endOffset: number;
  color: string;
  text: string;
};

export type Note = {
  id: string;
  position: number;
  anchorText: string;
  body: string;
};

type Segment =
  | { kind: "text"; text: string; hl?: Highlight; segStart: number }
  | { kind: "note"; note: Note };

function buildSegments(text: string, highlights: Highlight[], notes: Note[]): Segment[] {
  type Ev =
    | { offset: number; type: "hl-start"; hl: Highlight }
    | { offset: number; type: "hl-end"; hl: Highlight }
    | { offset: number; type: "note"; note: Note };

  const events: Ev[] = [];
  for (const h of highlights) {
    events.push({ offset: h.startOffset, type: "hl-start", hl: h });
    events.push({ offset: h.endOffset, type: "hl-end", hl: h });
  }
  for (const n of notes) events.push({ offset: n.position, type: "note", note: n });

  events.sort((a, b) => {
    if (a.offset !== b.offset) return a.offset - b.offset;
    const ord = { note: 0, "hl-end": 1, "hl-start": 2 } as const;
    return ord[a.type] - ord[b.type];
  });

  const segments: Segment[] = [];
  let cursor = 0;
  let openHl: Highlight | undefined = undefined;

  for (const e of events) {
    if (e.offset > cursor) {
      segments.push({
        kind: "text",
        text: text.slice(cursor, e.offset),
        hl: openHl,
        segStart: cursor,
      });
      cursor = e.offset;
    }
    if (e.type === "hl-start") openHl = e.hl;
    else if (e.type === "hl-end") openHl = undefined;
    else if (e.type === "note") segments.push({ kind: "note", note: e.note });
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", text: text.slice(cursor), hl: openHl, segStart: cursor });
  }
  return segments;
}

function offsetFromPoint(root: Node, node: Node, nodeOffset: number): number {
  if (!root.contains(node)) return -1;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (n === node) return total + nodeOffset;
    total += n.data.length;
  }
  return -1;
}

// Tıklama pozisyonundan tefsir text'inde offset hesaplar.
// Eğer tıklanan node text node ise direkt, span/element ise yakın metin node'una düşer.
function offsetFromClick(root: HTMLElement, ev: React.MouseEvent): number {
  // caretRangeFromPoint daha hassas; bazı tarayıcılarda yok
  const docAny = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  let node: Node | null = null;
  let nodeOffset = 0;

  if (docAny.caretRangeFromPoint) {
    const r = docAny.caretRangeFromPoint(ev.clientX, ev.clientY);
    if (r) {
      node = r.startContainer;
      nodeOffset = r.startOffset;
    }
  } else if (docAny.caretPositionFromPoint) {
    const c = docAny.caretPositionFromPoint(ev.clientX, ev.clientY);
    if (c) {
      node = c.offsetNode;
      nodeOffset = c.offset;
    }
  }

  if (!node || !root.contains(node)) return -1;
  // Eğer text node değilse, içine en yakın text node'u bul
  if (node.nodeType !== Node.TEXT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first) {
      node = first;
      nodeOffset = 0;
    } else return -1;
  }
  return offsetFromPoint(root, node, nodeOffset);
}

/** Arama sonucu için ilk eşleşmeyi vurgular */
function renderTextWithFind(
  chunk: string,
  find: string | undefined,
  markFirst: { done: boolean }
) {
  if (!find?.trim()) return chunk;
  const qq = find.trim();
  const lower = chunk.toLocaleLowerCase("tr");
  const idx = lower.indexOf(qq.toLocaleLowerCase("tr"));
  if (idx < 0) return chunk;
  const before = chunk.slice(0, idx);
  const match = chunk.slice(idx, idx + qq.length);
  const after = chunk.slice(idx + qq.length);
  const markId = !markFirst.done ? "search-hit" : undefined;
  if (markId) markFirst.done = true;
  return (
    <>
      {before}
      <mark
        id={markId}
        className="bg-amber-200 dark:bg-amber-700/70 rounded px-0.5 ring-2 ring-amber-500"
      >
        {match}
      </mark>
      {after}
    </>
  );
}

function PdfIconLink({
  surahId,
  ayahNo,
  tafsirId,
}: {
  surahId: number;
  ayahNo: number;
  tafsirId: number;
}) {
  return (
    <a
      href={`/yazdir/${surahId}/${ayahNo}/${tafsirId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="PDF indir"
      title="PDF indir"
      className="inline-flex items-center justify-center w-8 h-8 rounded border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-red-700 dark:hover:text-red-400 transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 14.5h7v1.5h-7v-1.5zm0 3h5v1.5h-5v-1.5z" />
      </svg>
    </a>
  );
}

export function TafsirContentView({
  surahId,
  ayahNo,
  tafsirId,
  tafsirName,
  text,
  highlights,
  notes,
  onSelectionChange,
  onHighlightClick,
  onNoteClick,
  onAddNoteAt,
  hiddenNoteIds,
  onToggleNoteHidden,
  focusHighlightId,
  focusNoteId,
  focusFind,
  scrollToOffset,
}: {
  surahId: number;
  ayahNo: number;
  tafsirId: number;
  tafsirName: string;
  text: string;
  highlights: Highlight[];
  notes: Note[];
  onSelectionChange: (s: ActiveSelection | null) => void;
  onHighlightClick: (id: string) => void;
  onNoteClick: (n: Note) => void;
  onAddNoteAt: (position: number, anchorText: string) => void;
  hiddenNoteIds: Set<string>;
  onToggleNoteHidden: (id: string) => void;
  focusHighlightId?: string;
  focusNoteId?: string;
  focusFind?: string;
  /** "Burada kaldım" geri dönüşünde kaydırılacak karakter offset'i */
  scrollToOffset?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTriggeredRef = useRef(false);
  const findTriggeredRef = useRef(false);
  const offsetScrolledRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const findMark = useRef({ done: false });
  findMark.current.done = false;

  const segments = useMemo(() => buildSegments(text, highlights, notes), [text, highlights, notes]);

  const updateSelection = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      onSelectionChange(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
      onSelectionChange(null);
      return;
    }
    const a = offsetFromPoint(root, range.startContainer, range.startOffset);
    const b = offsetFromPoint(root, range.endContainer, range.endOffset);
    if (a < 0 || b < 0 || a === b) {
      onSelectionChange(null);
      return;
    }
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    onSelectionChange({ start, end, snippet: text.slice(start, end) });
  }, [text, onSelectionChange]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [updateSelection]);

  useEffect(() => {
    onSelectionChange(null);
    findTriggeredRef.current = false;
  }, [text, onSelectionChange]);

  useEffect(() => {
    findTriggeredRef.current = false;
  }, [focusFind]);

  // Hedef vurgu / nota scroll et + kısa süreli vurgu efekti
  useEffect(() => {
    if (focusTriggeredRef.current) return;
    if (!focusHighlightId && !focusNoteId) return;
    const id = focusHighlightId
      ? `hl-${focusHighlightId}`
      : focusNoteId
      ? `note-${focusNoteId}`
      : null;
    if (!id) return;
    // segments render edildikten sonra DOM'da olur
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-500", "rounded-sm");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-500", "rounded-sm");
        }, 2400);
        focusTriggeredRef.current = true;
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [focusHighlightId, focusNoteId, segments]);

  // Arama: tefsir metninde find ibaresine scroll
  useEffect(() => {
    if (findTriggeredRef.current || !focusFind?.trim()) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById("search-hit");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        findTriggeredRef.current = true;
        const params = new URLSearchParams(searchParams.toString());
        params.delete("find");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [focusFind, segments, pathname, router, searchParams]);

  // "Burada kaldım" geri dönüşü: kaydedilen karakter offset'ine kaydır (bir kez)
  useEffect(() => {
    if (offsetScrolledRef.current) return;
    if (scrollToOffset == null || scrollToOffset <= 0) return;
    const t = window.setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let total = 0;
      let target: { node: Text; off: number } | null = null;
      while (walker.nextNode()) {
        const n = walker.currentNode as Text;
        const len = n.data.length;
        if (total + len >= scrollToOffset) {
          target = { node: n, off: Math.max(0, Math.min(scrollToOffset - total, len)) };
          break;
        }
        total += len;
      }
      if (!target || target.node.data.length === 0) return;
      const range = document.createRange();
      range.setStart(target.node, target.off);
      range.setEnd(target.node, Math.min(target.off + 1, target.node.data.length));
      const rect = range.getBoundingClientRect();
      const headerH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--ayah-sticky-h")
        ) || 150;
      const top = window.scrollY + rect.top - headerH - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      offsetScrolledRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pos");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => window.clearTimeout(t);
  }, [scrollToOffset, segments, pathname, router, searchParams]);

  // Metne çift tıkla → not ekle (tek tıkla kazara not açılmasını önler)
  function handleAddNote(e: React.MouseEvent<HTMLDivElement>) {
    // Vurgu/not öğesine tıklandıysa atla
    const target = e.target as HTMLElement;
    if (target.closest("[data-skip-add-note]")) return;

    const root = containerRef.current;
    if (!root) return;
    const pos = offsetFromClick(root, e);
    if (pos < 0) return;
    // Çift tıklamada tarayıcı kelimeyi seçer; seçimi temizle ki vurgu aracı açılmasın
    window.getSelection()?.removeAllRanges();
    onSelectionChange(null);
    const ctxStart = Math.max(0, pos - 25);
    const ctxEnd = Math.min(text.length, pos + 25);
    const anchorText = text.slice(ctxStart, ctxEnd).replace(/\s+/g, " ").trim();
    onAddNoteAt(pos, anchorText);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          {tafsirName}
        </h3>
        <div className="flex items-center gap-1.5">
          <FontSizeControl />
          <PdfIconLink surahId={surahId} ayahNo={ayahNo} tafsirId={tafsirId} />
        </div>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
        Tefsire çift tıklayarak hızlıca not ekleyebilir, metin seçerek vurgu yapabilirsiniz.
      </p>

      <div
        ref={containerRef}
        onDoubleClick={handleAddNote}
        className="tefsir-body whitespace-pre-wrap text-stone-800 dark:text-stone-200 select-text cursor-text"
      >
        {segments.map((seg, i) => {
          if (seg.kind === "note") {
            const isHidden = hiddenNoteIds.has(seg.note.id);
            const short =
              seg.note.body.length > 60
                ? seg.note.body.slice(0, 60).trimEnd() + "…"
                : seg.note.body;
            return (
              <span
                key={`n-${seg.note.id}-${i}`}
                id={`note-${seg.note.id}`}
                data-skip-add-note
                onClick={(ev) => {
                  ev.stopPropagation();
                  onNoteClick(seg.note);
                }}
                onDoubleClick={(ev) => {
                  ev.stopPropagation();
                  onToggleNoteHidden(seg.note.id);
                }}
                title={seg.note.body}
                className="note-inline"
              >
                {" "}✎ {isHidden ? "" : short}{" "}
              </span>
            );
          }
          if (seg.hl) {
            const cls = `hl hl-${seg.hl.color || "yellow"}`;
            return (
              <span
                key={`t-${i}`}
                id={`hl-${seg.hl.id}`}
                data-skip-add-note
                className={cls}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onHighlightClick(seg.hl!.id);
                }}
                title="Tıkla → vurguyu sil"
              >
                {seg.text}
              </span>
            );
          }
          return (
            <span key={`t-${i}`}>
              {renderTextWithFind(seg.text, focusFind, findMark.current)}
            </span>
          );
        })}
      </div>
    </>
  );
}
