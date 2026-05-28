"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Surah = { id: number; nameTr: string; ayetCount: number };

export function AyahSelector({
  current,
  surahs,
  tafsirId,
  variant = "default",
}: {
  current: { surahId: number; ayahNo: number; ayetCount: number };
  surahs: Surah[];
  tafsirId?: number | null;
  variant?: "default" | "toolbar";
}) {
  const router = useRouter();
  const [openSurah, setOpenSurah] = useState(false);
  const [openAyah, setOpenAyah] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const currentSurah = useMemo(
    () => surahs.find((s) => s.id === current.surahId) ?? surahs[0],
    [current.surahId, surahs]
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpenSurah(false);
        setOpenAyah(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) {
          return;
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "k" || e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.surahId, current.ayahNo, currentSurah?.ayetCount, tafsirId]);

  function navigate(newSurahId: number, newAyahNo: number) {
    const base = `/oku/${newSurahId}/${newAyahNo}`;
    const href = tafsirId ? `${base}?tafsir=${tafsirId}` : base;
    router.push(href);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return surahs;
    return surahs.filter(
      (s) => s.nameTr.toLocaleLowerCase("tr").includes(q) || String(s.id).startsWith(q)
    );
  }, [query, surahs]);

  function prev() {
    if (current.ayahNo > 1) navigate(current.surahId, current.ayahNo - 1);
    else if (current.surahId > 1) {
      const ps = surahs.find((s) => s.id === current.surahId - 1);
      navigate(current.surahId - 1, ps?.ayetCount ?? 1);
    }
  }
  function next() {
    if (currentSurah && current.ayahNo < currentSurah.ayetCount)
      navigate(current.surahId, current.ayahNo + 1);
    else if (current.surahId < 114) navigate(current.surahId + 1, 1);
  }

  const isToolbar = variant === "toolbar";

  const navBtnClass = isToolbar
    ? "h-9 w-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-stone-800 hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0"
    : "px-3 rounded-md hover:bg-emerald-50 dark:hover:bg-stone-800 text-emerald-700 dark:text-emerald-300 text-lg";

  const pickBtnClass = isToolbar
    ? "h-9 px-3 flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-sm font-medium text-stone-800 dark:text-stone-100 min-w-0"
    : "min-w-[200px] px-3 py-2 text-left bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600";

  const pickAyahClass = isToolbar
    ? "h-9 px-3 flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-sm font-medium text-stone-800 dark:text-stone-100 shrink-0"
    : "min-w-[100px] px-3 py-2 text-left bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600";

  return (
    <div
      ref={ref}
      className={
        isToolbar
          ? "flex items-center gap-1.5 w-full"
          : "flex items-stretch gap-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-stone-900 shadow-sm p-1"
      }
    >
      <button type="button" onClick={prev} className={navBtnClass} aria-label="Önceki ayet" title="Önceki ayet (J)">
        ‹
      </button>

      <div className="relative flex-1 min-w-0">
        <button
          type="button"
          onClick={() => {
            setOpenSurah((v) => !v);
            setOpenAyah(false);
          }}
          className={`${pickBtnClass} w-full max-w-full`}
        >
          {isToolbar ? (
            <>
              <span className="text-[10px] uppercase tracking-wide text-stone-400 shrink-0">Sûre</span>
              <span className="truncate">
                {current.surahId}. {currentSurah?.nameTr}
              </span>
              <span className="text-stone-400 shrink-0 ml-auto">▾</span>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                Sûre
              </div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 flex items-center justify-between">
                <span>
                  {current.surahId}. {currentSurah?.nameTr}
                </span>
                <span className="text-stone-400 ml-2">▾</span>
              </div>
            </>
          )}
        </button>
        {openSurah && (
          <div className="absolute z-30 mt-1 left-0 w-[min(100%,280px)] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl max-h-[60vh] overflow-hidden flex flex-col">
            <div className="p-2 border-b border-stone-200 dark:border-stone-700">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sûre ara..."
                className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
              />
            </div>
            <ul className="overflow-y-auto flex-1">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSurah(false);
                      setQuery("");
                      navigate(s.id, 1);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-stone-800 flex items-center justify-between ${
                      s.id === current.surahId
                        ? "bg-emerald-50 dark:bg-emerald-950/40 font-semibold text-emerald-800 dark:text-emerald-200"
                        : ""
                    }`}
                  >
                    <span>
                      <span className="text-stone-400 mr-1.5">{s.id}.</span>
                      {s.nameTr}
                    </span>
                    <span className="text-xs text-stone-400">{s.ayetCount}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-stone-500">Eşleşme yok.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setOpenAyah((v) => !v);
            setOpenSurah(false);
          }}
          className={pickAyahClass}
        >
          {isToolbar ? (
            <>
              <span className="text-[10px] uppercase tracking-wide text-stone-400">Âyet</span>
              <span className="font-semibold tabular-nums">
                {current.ayahNo}
                <span className="text-stone-400 font-normal"> / {currentSurah?.ayetCount}</span>
              </span>
              <span className="text-stone-400">▾</span>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                Âyet
              </div>
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 flex items-center justify-between">
                <span>
                  {current.ayahNo}{" "}
                  <span className="text-stone-400 text-xs">/ {currentSurah?.ayetCount}</span>
                </span>
                <span className="text-stone-400 ml-2">▾</span>
              </div>
            </>
          )}
        </button>
        {openAyah && (
          <div className="absolute z-30 mt-1 right-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl max-h-[60vh] overflow-y-auto p-2 w-[220px]">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: currentSurah?.ayetCount ?? 1 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setOpenAyah(false);
                    navigate(current.surahId, n);
                  }}
                  className={`text-xs px-2 py-1.5 rounded-md font-medium ${
                    n === current.ayahNo
                      ? "bg-emerald-700 text-white"
                      : "hover:bg-emerald-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={next} className={navBtnClass} aria-label="Sonraki ayet" title="Sonraki ayet (K)">
        ›
      </button>
    </div>
  );
}
