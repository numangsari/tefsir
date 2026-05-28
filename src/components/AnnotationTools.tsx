"use client";

import type { Highlight, Note } from "./TafsirContentView";
import type { Selection } from "./TafsirReader";

export function AnnotationTools({
  selection,
  onHighlight,
  onAddNote,
  highlights,
  notes,
  hiddenNoteIds,
  onToggleNoteHidden,
  onHighlightClick,
  onNoteClick,
}: {
  selection: Selection | null;
  onHighlight: (color: string) => void;
  onAddNote: () => void;
  highlights: Highlight[];
  notes: Note[];
  hiddenNoteIds: Set<string>;
  onToggleNoteHidden: (id: string) => void;
  onHighlightClick: (id: string) => void;
  onNoteClick: (n: Note) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Üst kısım — aktif seçim varsa altını çiz / not ekle */}
      <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <h3 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Altını Çiz / Not Ekle
        </h3>
        {selection ? (
          <>
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-2 italic line-clamp-2">
              &ldquo;{selection.snippet}&rdquo;
            </div>
            <button
              onClick={() => onHighlight("green")}
              className="w-full px-3 py-1.5 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded mb-2"
            >
              Seçili metnin altını çiz
            </button>
            <button
              onClick={onAddNote}
              className="w-full px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded"
            >
              ✎ Bu seçime not ekle
            </button>
          </>
        ) : (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Metin seçince renk araçları burada açılır. Not eklemek için tefsirin herhangi bir yerine
            tıklayın.
          </p>
        )}
      </section>

      {/* Vurgular listesi */}
      <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <h3 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Bu tefsirdeki vurgularım ({highlights.length})
        </h3>
        {highlights.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">Henüz yok.</p>
        ) : (
          <ul className="space-y-1.5">
            {highlights.map((h) => (
              <li
                key={h.id}
                className="text-xs flex items-start gap-1.5 group"
              >
                <span className="inline-block w-2.5 h-2.5 mt-1 rounded-sm shrink-0 bg-emerald-600" />
                <span className="flex-1 italic text-stone-700 dark:text-stone-300 line-clamp-2">
                  &ldquo;{h.text}&rdquo;
                </span>
                <button
                  onClick={() => onHighlightClick(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-600 text-xs"
                  title="Sil"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notlar listesi */}
      <section className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <h3 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
          Bu tefsirdeki notlarım ({notes.length})
        </h3>
        {notes.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">Henüz yok.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id}>
                <div className="w-full text-left text-xs p-2 rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-stone-900">
                  <button
                    onClick={() => onNoteClick(n)}
                    className="w-full text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded px-1 py-0.5"
                  >
                    <div className="text-emerald-700 dark:text-emerald-300">✎ Not</div>
                    {hiddenNoteIds.has(n.id) ? (
                      <div className="text-stone-500 dark:text-stone-400">Bu not gizli (yalnız işaret).</div>
                    ) : (
                      <div className="text-stone-700 dark:text-stone-300 line-clamp-3">{n.body}</div>
                    )}
                  </button>
                  <button
                    onClick={() => onToggleNoteHidden(n.id)}
                    className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    {hiddenNoteIds.has(n.id) ? "Gizlemeyi kaldır" : "Gizle"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
