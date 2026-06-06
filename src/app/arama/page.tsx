"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SearchHighlight,
  ALL_SEARCH_TYPES,
  SEARCH_TYPE_LABELS,
  SEARCH_CATEGORY_STYLES,
  buildSearchQuery,
  tafsirSearchHref,
  type SearchType,
} from "@/components/SearchHighlight";

type Results = {
  surahs: { id: number; nameTr: string; ayetCount: number }[];
  ayahs: { surahId: number; surahName: string; number: number; text: string; source: string }[];
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

export default function AramaPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [types, setTypes] = useState<SearchType[]>([...ALL_SEARCH_TYPES]);
  const [filterSurah, setFilterSurah] = useState("");
  const [filterAyah, setFilterAyah] = useState("");

  // URL'deki ?q= ile gelen aramayı uygula (Google sitelinks arama kutusu /
  // paylaşılan arama linki buraya düşer). Mount'ta bir kez okunur.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) setQ(initial);
  }, []);

  useEffect(() => {
    const qq = q.trim();
    if (qq.length < 2) {
      setResults(null);
      return;
    }
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const qs = buildSearchQuery(qq, types, filterSurah, filterAyah);
        const r = await fetch(`/api/search?${qs}`);
        if (r.ok) setResults((await r.json()) as Results);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [q, types, filterSurah, filterAyah]);

  const empty = useMemo(
    () =>
      !!results &&
      results.surahs.length === 0 &&
      results.ayahs.length === 0 &&
      results.tafsirs.length === 0 &&
      results.notes.length === 0 &&
      results.highlights.length === 0,
    [results]
  );

  function toggleType(t: SearchType) {
    setTypes((prev) => {
      if (prev.includes(t)) {
        const next = prev.filter((x) => x !== t);
        return next.length === 0 ? [...ALL_SEARCH_TYPES] : next;
      }
      return [...prev, t];
    });
  }

  const qq = q.trim();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
      >
        ← Geri
      </button>

      <h1 className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300 mb-3">Arama</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Sûre adlarında, meallerde, tefsir metinlerinde ve kendi not/vurgularında arama yap.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ara (en az 2 karakter)..."
        className="w-full border rounded-md px-3 py-2 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 mb-3"
      />

      <div className="flex flex-wrap gap-2 mb-3">
        {ALL_SEARCH_TYPES.map((t) => {
          const st = SEARCH_CATEGORY_STYLES[t];
          const active = types.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={`px-2.5 py-1 text-xs rounded-full border ${
                active ? st.chipActive : st.chipInactive
              }`}
            >
              {SEARCH_TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <label className="text-sm">
          <span className="block text-xs text-stone-500 mb-1">Sûre no (isteğe bağlı)</span>
          <input
            type="number"
            min={1}
            max={114}
            value={filterSurah}
            onChange={(e) => setFilterSurah(e.target.value)}
            placeholder="Örn. 2"
            className="w-24 border rounded px-2 py-1 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-stone-500 mb-1">Âyet no (isteğe bağlı)</span>
          <input
            type="number"
            min={1}
            value={filterAyah}
            onChange={(e) => setFilterAyah(e.target.value)}
            placeholder="Örn. 255"
            className="w-24 border rounded px-2 py-1 bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
          />
        </label>
      </div>

      {loading && <div className="text-sm text-stone-500 dark:text-stone-400">Aranıyor...</div>}
      {qq.length > 0 && qq.length < 2 && (
        <div className="text-sm text-stone-500 dark:text-stone-400">En az 2 karakter yaz.</div>
      )}
      {empty && <div className="text-sm text-stone-500 dark:text-stone-400">Eşleşme bulunamadı.</div>}

      {results && (
        <div className="space-y-5">
          <Section category="surah" title={`Sûreler (${results.surahs.length})`}>
            {results.surahs.map((s) => (
              <RowLink
                key={`s-${s.id}`}
                category="surah"
                href={`/oku/${s.id}/1?flash=ayah`}
                title={`${s.id}. ${s.nameTr}`}
                subtitle={`${s.ayetCount} ayet`}
                q={qq}
              />
            ))}
          </Section>

          <Section category="meal" title={`Mealler (${results.ayahs.length})`}>
            {results.ayahs.map((a) => (
              <RowLink
                key={`a-${a.surahId}-${a.number}-${a.source}`}
                category="meal"
                href={`/oku/${a.surahId}/${a.number}?flash=meal`}
                title={`${a.surahName} · ${a.number}. ayet (${a.source})`}
                subtitle={a.text}
                q={qq}
              />
            ))}
          </Section>

          <Section category="tafsir" title={`Tefsirler (${results.tafsirs.length})`}>
            {results.tafsirs.map((t, i) => (
              <RowLink
                key={`t-${t.tafsirId}-${t.surahId}-${t.ayahNo}-${i}`}
                category="tafsir"
                href={tafsirSearchHref(t.surahId, t.ayahNo, t.tafsirId, qq)}
                title={`${t.surahName} · ${t.ayahNo} — ${t.tafsirName}`}
                subtitle={t.text}
                q={qq}
              />
            ))}
          </Section>

          <Section category="note" title={`Notlarım (${results.notes.length})`}>
            {results.notes.map((n) => (
              <RowLink
                key={`n-${n.id}`}
                category="note"
                href={`/oku/${n.surahId}/${n.ayahNo}?tafsir=${n.tafsirId}&note=${n.id}`}
                title={`${n.surahName} · ${n.ayahNo} — ${n.tafsirName}`}
                subtitle={n.body}
                q={qq}
              />
            ))}
          </Section>

          <Section category="highlight" title={`Vurgularım (${results.highlights.length})`}>
            {results.highlights.map((h) => (
              <RowLink
                key={`h-${h.id}`}
                category="highlight"
                href={`/oku/${h.surahId}/${h.ayahNo}?tafsir=${h.tafsirId}&hl=${h.id}`}
                title={`${h.surahName} · ${h.ayahNo} — ${h.tafsirName}`}
                subtitle={h.text}
                q={qq}
              />
            ))}
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
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
    <section className={`rounded-md border overflow-hidden ${st.section}`}>
      <h2 className="px-3 py-2 text-xs uppercase tracking-wide font-medium opacity-90">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function RowLink({
  category,
  href,
  title,
  subtitle,
  q,
}: {
  category: SearchType;
  href: string;
  title: string;
  subtitle: string;
  q: string;
}) {
  const st = SEARCH_CATEGORY_STYLES[category];
  return (
    <Link
      href={href}
      className={`block px-3 py-2 border-t border-stone-100/80 dark:border-stone-800/80 hover:bg-white/60 dark:hover:bg-stone-800/60 ${st.rowBorder}`}
    >
      <div className="text-sm text-stone-800 dark:text-stone-200">{title}</div>
      <div className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
        <SearchHighlight text={subtitle} q={q} markClassName={st.mark} />
      </div>
    </Link>
  );
}
