/** Arama sonuçlarında eşleşen metni vurgular */
export function SearchHighlight({
  text,
  q,
  markClassName = "bg-amber-200 dark:bg-amber-700/60 rounded px-0.5",
}: {
  text: string;
  q: string;
  markClassName?: string;
}) {
  const qq = q.trim().toLocaleLowerCase("tr");
  if (!qq) return <>{text}</>;
  const lower = text.toLocaleLowerCase("tr");
  const idx = lower.indexOf(qq);
  if (idx < 0) return <>{text}</>;
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + qq.length + 60);
  const before = text.slice(start, idx);
  const match = text.slice(idx, idx + qq.length);
  const after = text.slice(idx + qq.length, end);
  return (
    <>
      {start > 0 ? "…" : ""}
      {before}
      <mark className={markClassName}>{match}</mark>
      {after}
      {end < text.length ? "…" : ""}
    </>
  );
}

export type SearchType = "surah" | "meal" | "tafsir" | "note" | "highlight";

export const ALL_SEARCH_TYPES: SearchType[] = [
  "surah",
  "meal",
  "tafsir",
  "note",
  "highlight",
];

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  surah: "Sûre",
  meal: "Meal",
  tafsir: "Tefsir",
  note: "Notlar",
  highlight: "Vurgular",
};

export const SEARCH_CATEGORY_STYLES: Record<
  SearchType,
  { chipActive: string; chipInactive: string; section: string; rowBorder: string; mark: string }
> = {
  surah: {
    chipActive: "bg-emerald-700 text-white border-emerald-700",
    chipInactive: "border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
    section: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    rowBorder: "border-l-4 border-l-emerald-500",
    mark: "bg-emerald-200 dark:bg-emerald-800/60 rounded px-0.5",
  },
  meal: {
    chipActive: "bg-sky-700 text-white border-sky-700",
    chipInactive: "border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300",
    section: "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800",
    rowBorder: "border-l-4 border-l-sky-500",
    mark: "bg-sky-200 dark:bg-sky-800/60 rounded px-0.5",
  },
  tafsir: {
    chipActive: "bg-violet-700 text-white border-violet-700",
    chipInactive: "border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300",
    section: "bg-violet-50/80 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
    rowBorder: "border-l-4 border-l-violet-500",
    mark: "bg-violet-200 dark:bg-violet-800/60 rounded px-0.5",
  },
  note: {
    chipActive: "bg-amber-700 text-white border-amber-700",
    chipInactive: "border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
    section: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    rowBorder: "border-l-4 border-l-amber-500",
    mark: "bg-amber-200 dark:bg-amber-800/60 rounded px-0.5",
  },
  highlight: {
    chipActive: "bg-rose-700 text-white border-rose-700",
    chipInactive: "border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300",
    section: "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
    rowBorder: "border-l-4 border-l-rose-500",
    mark: "bg-rose-200 dark:bg-rose-800/60 rounded px-0.5",
  },
};

export function buildSearchQuery(
  q: string,
  types: SearchType[],
  surahId?: string,
  ayahNo?: string
): string {
  const params = new URLSearchParams();
  params.set("q", q);
  if (types.length > 0 && types.length < ALL_SEARCH_TYPES.length) {
    params.set("types", types.join(","));
  }
  if (surahId) params.set("surahId", surahId);
  if (ayahNo) params.set("ayahNo", ayahNo);
  return params.toString();
}

export function tafsirSearchHref(
  surahId: number,
  ayahNo: number,
  tafsirId: number,
  query: string
) {
  const params = new URLSearchParams();
  params.set("tafsir", String(tafsirId));
  if (query.trim()) params.set("find", query.trim());
  return `/oku/${surahId}/${ayahNo}?${params.toString()}`;
}
