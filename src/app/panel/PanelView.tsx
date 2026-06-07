"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toaster";

type Item = {
  kind: "highlight" | "note";
  id: string;
  tafsirId: number;
  tafsirName: string;
  surahId: number;
  surahName: string;
  ayahNo: number;
  text: string;
  anchorText?: string;
  color?: string;
  createdAt: string;
};

const HL_BG: Record<string, string> = {
  yellow: "#fde68a",
  green: "#a7f3d0",
  blue: "#bfdbfe",
  pink: "#fbcfe8",
};

export function PanelView({
  surahs,
  tafsirs,
}: {
  surahs: { id: number; nameTr: string }[];
  tafsirs: { id: number; name: string }[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSurah, setFilterSurah] = useState<string>("");
  const [filterTafsir, setFilterTafsir] = useState<string>("");
  const [filterKind, setFilterKind] = useState<"all" | "highlight" | "note">("all");
  const toast = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSurah) params.set("surahId", filterSurah);
    if (filterTafsir) params.set("tafsirId", filterTafsir);
    const r = await fetch(`/api/my/all?${params}`, { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as Item[];
      setItems(data);
    }
    setLoading(false);
  }, [filterSurah, filterTafsir]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const visible = items.filter((i) => filterKind === "all" || i.kind === filterKind);

  async function removeHighlight(id: string) {
    const ok = await toast.confirm("Bu vurguyu silmek istiyor musunuz?");
    if (!ok) return;
    const r = await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    if (r.ok) {
      setItems((xs) => xs.filter((x) => !(x.kind === "highlight" && x.id === id)));
      toast.success("Vurgu silindi.");
    } else toast.error("Silinemedi.");
  }
  async function removeNote(id: string) {
    const ok = await toast.confirm("Bu notu silmek istiyor musunuz?");
    if (!ok) return;
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) {
      setItems((xs) => xs.filter((x) => !(x.kind === "note" && x.id === id)));
      toast.success("Not silindi.");
    } else toast.error("Silinemedi.");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-emerald-700 dark:text-emerald-300">
          Notlarım
        </h1>
      </header>

      {/* Filtreler */}
      <section className="surface-glass !rounded-xl p-4 mb-4">
        <h2 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Filtreler
        </h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex-1 min-w-[160px]">
            <span className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Sûre</span>
            <select
              value={filterSurah}
              onChange={(e) => setFilterSurah(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="">Tüm sûreler</option>
              {surahs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.nameTr}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[160px]">
            <span className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Tefsir</span>
            <select
              value={filterTafsir}
              onChange={(e) => setFilterTafsir(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="">Tüm tefsirler</option>
              {tafsirs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[140px]">
            <span className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Tür</span>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value as "all" | "highlight" | "note")}
              className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="all">Hepsi</option>
              <option value="highlight">Sadece vurgular</option>
              <option value="note">Sadece notlar</option>
            </select>
          </label>
          <div className="flex items-end">
            <a
              href={`/yazdir/panel?surahId=${filterSurah}&tafsirId=${filterTafsir}&kind=${filterKind}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm btn-outline-glow"
            >
              PDF / Yazdır
            </a>
          </div>
        </div>
      </section>

      {/* Sonuçlar */}
      <section className="surface-glass !rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {loading ? "Yükleniyor..." : `${visible.length} kayıt`}
          </h2>
        </div>

        {!loading && visible.length === 0 && (
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            Filtreye uyan kayıt yok.
          </p>
        )}

        <ul className="space-y-3">
          {visible.map((it) => (
            <li
              key={`${it.kind}-${it.id}`}
              className="surface-glass !rounded-xl p-3"
            >
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800">
                    {it.kind === "highlight" ? "Vurgu" : "Not"}
                  </span>
                  <Link
                    href={`/oku/${it.surahId}/${it.ayahNo}`}
                    className="text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    {it.surahName} · {it.ayahNo}
                  </Link>
                  <span>—</span>
                  <span>{it.tafsirName}</span>
                </div>
                <span>{new Date(it.createdAt).toLocaleString("tr-TR")}</span>
              </div>

              {it.kind === "highlight" ? (
                <div className="text-sm flex items-start gap-2">
                  <span
                    className="inline-block w-3 h-3 mt-1 rounded-sm shrink-0"
                    style={{ backgroundColor: HL_BG[it.color || "yellow"] }}
                  />
                  <span className="italic text-stone-800 dark:text-stone-200 flex-1">
                    &ldquo;{it.text}&rdquo;
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/oku/${it.surahId}/${it.ayahNo}?tafsir=${it.tafsirId}&hl=${it.id}`}
                      className="px-2 py-0.5 text-xs rounded border border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      Git →
                    </Link>
                    <button
                      onClick={() => removeHighlight(it.id)}
                      className="text-stone-400 hover:text-red-600 text-xs"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <div className="text-xs text-stone-500 dark:text-stone-400 italic mb-1">
                    &ldquo;…{it.anchorText}…&rdquo;
                  </div>
                  <div className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                    {it.text}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Link
                      href={`/oku/${it.surahId}/${it.ayahNo}?tafsir=${it.tafsirId}&note=${it.id}`}
                      className="px-2 py-0.5 text-xs rounded border border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      Git →
                    </Link>
                    <button
                      onClick={() => removeNote(it.id)}
                      className="text-stone-400 hover:text-red-600 text-xs"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
