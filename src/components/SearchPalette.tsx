"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SearchHighlight,
  ALL_SEARCH_TYPES,
  SEARCH_CATEGORY_STYLES,
  buildSearchQuery,
  tafsirSearchHref,
  type SearchType,
} from "@/components/SearchHighlight";

type Results = {
  surahs: {
    id: number;
    nameTr: string;
    ayetCount: number;
  }[];
  ayahs: {
    surahId: number;
    surahName: string;
    number: number;
    text: string;
    source: string;
  }[];
  tafsirs: {
    tafsirId: number;
    tafsirName: string;
    surahId: number;
    surahName: string;
    ayahNo: number;
    text: string;
  }[];
  notes: {
    id: string;
    surahId: number;
    surahName: string;
    ayahNo: number;
    tafsirId: number;
    tafsirName: string;
    body: string;
  }[];
  highlights: {
    id: string;
    surahId: number;
    surahName: string;
    ayahNo: number;
    tafsirId: number;
    tafsirName: string;
    text: string;
  }[];
};

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Global kısayol
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !isTypingInInput(e.target)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Açılınca input'a odaklan
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ("");
      setResults(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const qs = buildSearchQuery(q.trim(), [...ALL_SEARCH_TYPES]);
        const r = await fetch(`/api/search?${qs}`);
        if (r.ok) setResults((await r.json()) as Results);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const close = useCallback(() => setOpen(false), []);

  function goto(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  const empty =
    !!results &&
    results.surahs.length === 0 &&
    results.ayahs.length === 0 &&
    results.tafsirs.length === 0 &&
    results.notes.length === 0 &&
    results.highlights.length === 0;

  return (
    <div
      className="fixed inset-0 z-[55] bg-black/40 flex items-start justify-center p-4 pt-20"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 px-3">
          <span className="text-stone-400">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Meallerde, kendi vurgu ve notlarınızda arayın..."
            className="flex-1 px-3 py-3 bg-transparent text-sm focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-500 dark:text-stone-400">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 && (
            <div className="p-6 text-center text-sm text-stone-500 dark:text-stone-400">
              En az 2 karakter yazın. Meal metni, vurguladığınız bölümler ve notlarınız aranır.
              <div className="mt-3 flex justify-center gap-2 text-xs">
                <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">⌘K</kbd>
                <span>aç/kapat</span>
                <kbd className="ml-3 px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">/</kbd>
                <span>hızlı aç</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400">
              Aranıyor...
            </div>
          )}

          {empty && !loading && (
            <div className="p-6 text-center text-sm text-stone-500 dark:text-stone-400">
              Eşleşme yok.
            </div>
          )}

          {results && !empty && (
            <>
              {results.ayahs.length > 0 && (
                <PaletteSection category="meal" title={`Meal (${results.ayahs.length})`}>
                  {results.ayahs.map((a) => (
                    <PaletteRow
                      key={`${a.surahId}-${a.number}`}
                      category="meal"
                      onClick={() => goto(`/oku/${a.surahId}/${a.number}?flash=meal`)}
                      meta={`${a.surahName} · ${a.number}. ayet (${a.source})`}
                      body={<SearchHighlight text={a.text} q={q} markClassName={SEARCH_CATEGORY_STYLES.meal.mark} />}
                    />
                  ))}
                </PaletteSection>
              )}

              {results.surahs.length > 0 && (
                <PaletteSection category="surah" title={`Sûre (${results.surahs.length})`}>
                  {results.surahs.map((s) => (
                    <PaletteRow
                      key={s.id}
                      category="surah"
                      onClick={() => goto(`/oku/${s.id}/1?flash=ayah`)}
                      meta={`${s.id}. ${s.nameTr}`}
                      body={<span className="text-xs opacity-80">{s.ayetCount} ayet</span>}
                    />
                  ))}
                </PaletteSection>
              )}

              {results.tafsirs.length > 0 && (
                <PaletteSection category="tafsir" title={`Tefsir (${results.tafsirs.length})`}>
                  {results.tafsirs.map((t, i) => (
                    <PaletteRow
                      key={`${t.tafsirId}-${t.surahId}-${t.ayahNo}-${i}`}
                      category="tafsir"
                      onClick={() => goto(tafsirSearchHref(t.surahId, t.ayahNo, t.tafsirId, q))}
                      meta={`${t.surahName} · ${t.ayahNo} — ${t.tafsirName}`}
                      body={<SearchHighlight text={t.text} q={q} markClassName={SEARCH_CATEGORY_STYLES.tafsir.mark} />}
                    />
                  ))}
                </PaletteSection>
              )}

              {results.highlights.length > 0 && (
                <PaletteSection category="highlight" title={`Vurgu (${results.highlights.length})`}>
                  {results.highlights.map((h) => (
                    <PaletteRow
                      key={h.id}
                      category="highlight"
                      onClick={() =>
                        goto(`/oku/${h.surahId}/${h.ayahNo}?tafsir=${h.tafsirId}&hl=${h.id}`)
                      }
                      meta={`${h.surahName} · ${h.ayahNo} — ${h.tafsirName}`}
                      body={
                        <span className="italic">
                          &ldquo;
                          <SearchHighlight text={h.text} q={q} markClassName={SEARCH_CATEGORY_STYLES.highlight.mark} />
                          &rdquo;
                        </span>
                      }
                    />
                  ))}
                </PaletteSection>
              )}

              {results.notes.length > 0 && (
                <PaletteSection category="note" title={`Not (${results.notes.length})`}>
                  {results.notes.map((n) => (
                    <PaletteRow
                      key={n.id}
                      category="note"
                      onClick={() =>
                        goto(`/oku/${n.surahId}/${n.ayahNo}?tafsir=${n.tafsirId}&note=${n.id}`)
                      }
                      meta={`${n.surahName} · ${n.ayahNo} — ${n.tafsirName}`}
                      body={<SearchHighlight text={n.body} q={q} markClassName={SEARCH_CATEGORY_STYLES.note.mark} />}
                    />
                  ))}
                </PaletteSection>
              )}
            </>
          )}
        </div>

        <div className="border-t border-stone-200 dark:border-stone-800 px-3 py-1.5 text-[10px] text-stone-500 dark:text-stone-400 flex justify-end gap-3">
          <span>
            <Link href="/sureler" onClick={close} className="hover:underline">
              Tüm sûreler →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function PaletteSection({
  category,
  title,
  children,
}: {
  category: SearchType;
  title: string;
  children: React.ReactNode;
}) {
  const st = SEARCH_CATEGORY_STYLES[category];
  return (
    <div className={`border-b last:border-b-0 ${st.section}`}>
      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-medium opacity-90">
        {title}
      </div>
      {children}
    </div>
  );
}

function PaletteRow({
  category,
  onClick,
  meta,
  body,
}: {
  category: SearchType;
  onClick: () => void;
  meta: string;
  body: React.ReactNode;
}) {
  const st = SEARCH_CATEGORY_STYLES[category];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 hover:bg-white/50 dark:hover:bg-stone-800/50 ${st.rowBorder}`}
    >
      <div className="text-xs text-stone-500 dark:text-stone-400">{meta}</div>
      <div className="text-sm text-stone-800 dark:text-stone-200 line-clamp-2">{body}</div>
    </button>
  );
}

function isTypingInInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}
