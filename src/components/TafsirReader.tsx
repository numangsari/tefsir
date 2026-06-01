"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TafsirContentView,
  type Highlight,
  type Note,
} from "./TafsirContentView";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { NotesPanel } from "./NotesPanel";
import { AnnotationTools } from "./AnnotationTools";
import { useToast } from "./Toaster";
import { useRequireAuth } from "@/lib/use-require-auth";
import { setPreferredTafsirId } from "@/lib/preferred-tafsir";

export type TafsirSummary = {
  id: number;
  code: string;
  name: string;
  slug: string;
  author: string | null;
  deathYearHijri: number | null;
  deathYearGregorian: number | null;
};

type TafsirData = {
  tafsir: { id: number; code: string; name: string };
  text: string;
  html: string;
  originalText: string | null;
  originalHtml: string | null;
  modernizedAt: string | null;
  modernizedBy: string | null;
  highlights: Highlight[];
  notes: Note[];
};

export type Selection = {
  start: number;
  end: number;
  snippet: string;
};

export function TafsirReader({
  surahId,
  ayahNo,
  ayahId,
  surahName,
  tafsirs,
  selectedId,
  onSelectedIdChange,
  showNotes,
  onShowNotesChange,
  focusHighlightId,
  focusNoteId,
  focusFind,
  flash,
}: {
  surahId: number;
  ayahNo: number;
  ayahId: number;
  surahName: string;
  tafsirs: TafsirSummary[];
  selectedId: number | null;
  onSelectedIdChange: (id: number) => void;
  showNotes: boolean;
  onShowNotesChange: (v: boolean) => void;
  focusHighlightId?: string;
  focusNoteId?: string;
  focusFind?: string;
  flash?: string;
}) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [readTafsirIds, setReadTafsirIds] = useState<Set<number>>(new Set());
  const [flashTafsirRing, setFlashTafsirRing] = useState(false);
  const [data, setData] = useState<TafsirData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [hiddenNoteIds, setHiddenNoteIds] = useState<Set<string>>(new Set());

  // Aktif text seçimi (sağ paneldeki araçlar bunu kullanır)
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null);
  // Düzenlenmekte olan veya yeni eklenen not için modal state
  const [draftNote, setDraftNote] = useState<{
    position: number;
    anchorText: string;
  } | null>(null);
  const [draftHideOnSave, setDraftHideOnSave] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const loadTafsir = useCallback(
    async (tafsirId: number) => {
      setLoading(true);
      setLoadError(null);
      try {
        const r = await fetch(`/api/tafsir/${surahId}/${ayahNo}/${tafsirId}`);
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setLoadError(j.error || "Tefsir içeriği yüklenemedi.");
          setData(null);
          return;
        }
        const d = (await r.json()) as TafsirData;
        setData(d);
        setLoadError(null);
      } finally {
        setLoading(false);
      }
    },
    [surahId, ayahNo]
  );

  useEffect(() => {
    if (selectedId != null) loadTafsir(selectedId);
  }, [selectedId, loadTafsir]);

  // Bu ayet için okundu işaretleri
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(
        `/api/my/tafsir-reads?surahId=${surahId}&ayahNo=${ayahNo}`,
        { cache: "no-store" }
      );
      if (!r.ok || cancelled) return;
      const d = (await r.json()) as { tafsirIds: number[] };
      if (!cancelled) setReadTafsirIds(new Set(d.tafsirIds));
    })();
    return () => {
      cancelled = true;
    };
  }, [surahId, ayahNo, ayahId]);

  // Tefsir metni arama sonucu vurgusu
  useEffect(() => {
    if (flash !== "tafsir") return;
    setFlashTafsirRing(true);
    const t = window.setTimeout(() => setFlashTafsirRing(false), 2400);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flash");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    return () => window.clearTimeout(t);
  }, [flash, pathname, router, searchParams]);

  // Tefsir veya ayet değişince metin seçimini sıfırla
  useEffect(() => {
    setActiveSelection(null);
    setHiddenNoteIds(new Set());
  }, [selectedId, ayahId]);

  async function createHighlight(color: string) {
    if (!activeSelection || !data) return;
    if (!requireAuth()) return;
    const r = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tafsirId: data.tafsir.id,
        ayahId,
        startOffset: activeSelection.start,
        endOffset: activeSelection.end,
        color,
        text: activeSelection.snippet,
      }),
    });
    if (r.ok) {
      const newHl = (await r.json()) as Highlight;
      setData((d) =>
        d
          ? {
              ...d,
              highlights: [...d.highlights, newHl].sort(
                (a, b) => a.startOffset - b.startOffset
              ),
            }
          : d
      );
      toast.success("Vurgu eklendi.");
    } else {
      toast.error("Vurgu eklenemedi.");
    }
    window.getSelection()?.removeAllRanges();
    setActiveSelection(null);
  }

  function startNoteFromSelection() {
    if (!activeSelection || !data) return;
    if (!requireAuth()) return;
    const text = data.text;
    const ctxStart = Math.max(0, activeSelection.start - 20);
    const ctxEnd = Math.min(text.length, activeSelection.end + 20);
    const anchorText = text.slice(ctxStart, ctxEnd).replace(/\s+/g, " ").trim();
    setDraftNote({ position: activeSelection.start, anchorText });
    window.getSelection()?.removeAllRanges();
    setActiveSelection(null);
  }

  async function saveDraftNote(body: string, hideOnSave: boolean) {
    if (!draftNote || !data) return;
    const r = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tafsirId: data.tafsir.id,
        ayahId,
        position: draftNote.position,
        anchorText: draftNote.anchorText,
        body,
      }),
    });
    if (r.ok) {
      const newNote = (await r.json()) as Note;
      setData((d) =>
        d
          ? {
              ...d,
              notes: [...d.notes, newNote].sort((a, b) => a.position - b.position),
            }
          : d
      );
      if (hideOnSave) {
        setHiddenNoteIds((prev) => new Set(prev).add(newNote.id));
      }
      toast.success(hideOnSave ? "Not eklendi (gizli)." : "Not eklendi.");
    } else {
      toast.error("Not eklenemedi.");
    }
    setDraftNote(null);
    setDraftHideOnSave(false);
  }

  async function updateNote(id: string, body: string) {
    const r = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (r.ok) {
      setData((d) =>
        d ? { ...d, notes: d.notes.map((n) => (n.id === id ? { ...n, body } : n)) } : d
      );
    }
  }

  async function deleteHighlight(id: string) {
    const ok = await toast.confirm("Bu vurguyu silmek istiyor musunuz?");
    if (!ok) return;
    const r = await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    if (r.ok) {
      setData((d) =>
        d ? { ...d, highlights: d.highlights.filter((h) => h.id !== id) } : d
      );
      toast.success("Vurgu silindi.");
    } else {
      toast.error("Silinemedi.");
    }
  }

  async function deleteNote(id: string) {
    const ok = await toast.confirm("Bu notu silmek istiyor musunuz?");
    if (!ok) return;
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) {
      setData((d) =>
        d ? { ...d, notes: d.notes.filter((n) => n.id !== id) } : d
      );
      setHiddenNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setEditingNote(null);
      toast.success("Not silindi.");
    } else {
      toast.error("Silinemedi.");
    }
  }

  async function toggleReadMark(tafsirId: number) {
    if (!requireAuth()) return;
    const marked = readTafsirIds.has(tafsirId);
    const r = await fetch("/api/my/tafsir-reads", {
      method: marked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surahId, ayahNo, tafsirId }),
    });
    if (r.ok) {
      setReadTafsirIds((prev) => {
        const next = new Set(prev);
        if (marked) next.delete(tafsirId);
        else next.add(tafsirId);
        return next;
      });
    } else {
      toast.error("Okundu işareti kaydedilemedi.");
    }
  }

  function toggleNoteHidden(noteId: string) {
    setHiddenNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  if (tafsirs.length === 0) {
    return (
      <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-amber-900 dark:text-amber-200">
        Bu ayetin tefsirleri henüz günümüz Türkçesine sadeleştirilmedi. Sadeleştirme tamamlandıkça
        burada görünecekler.
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-[230px_1fr_300px] gap-4">
      {/* Sol panel — bağımsız scroll */}
      <aside className="md:sticky md:top-[130px] md:self-start md:max-h-[calc(100vh-150px)] md:overflow-y-auto pr-1">
        <ul className="space-y-1">
          {tafsirs.map((t) => {
            const isRead = readTafsirIds.has(t.id);
            const isSelected = selectedId === t.id && !showNotes;
            return (
            <li key={t.id}>
              <div
                className={`relative rounded-lg border text-sm transition overflow-hidden ${
                  isSelected
                    ? "bg-emerald-700 border-emerald-700 shadow-sm"
                    : isRead
                    ? "bg-emerald-50/90 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onShowNotesChange(false);
                    setPreferredTafsirId(t.id);
                    onSelectedIdChange(t.id);
                  }}
                  className="w-full text-left px-3 py-2.5 pr-12"
                >
                  <div className={`font-medium ${isSelected ? "text-white" : ""}`}>{t.name}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    isSelected
                      ? "text-emerald-100"
                      : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {t.author ? (
                    <>
                      {t.author}
                      {t.deathYearHijri && t.deathYearGregorian ? (
                        <span className="opacity-80">
                          {" "}
                          · ö. {t.deathYearHijri}/{t.deathYearGregorian}
                        </span>
                      ) : null}
                    </>
                  ) : t.deathYearHijri && t.deathYearGregorian ? (
                    <>
                      ö. {t.deathYearHijri}/{t.deathYearGregorian}
                    </>
                  ) : null}
                </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReadMark(t.id);
                  }}
                  title={isRead ? "Okundu işaretini kaldır" : "Okudum olarak işaretle"}
                  aria-label={isRead ? "Okundu" : "Okudum"}
                  aria-pressed={isRead}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    isRead
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-100"
                      : isSelected
                      ? "bg-emerald-800/40 border-emerald-200/60 text-emerald-100 hover:bg-emerald-800/60"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500"
                  }`}
                >
                  {isRead ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="text-[9px] font-semibold leading-none tracking-tight">OKU</span>
                  )}
                </button>
              </div>
            </li>
          );
          })}
        </ul>
      </aside>

      {/* Orta — tefsir gövdesi */}
      <main
        className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md p-6 min-h-[60vh] transition-shadow ${
          flashTafsirRing ? "ring-2 ring-amber-500" : ""
        }`}
      >
        {loading && <div className="text-stone-500 dark:text-stone-400">Yükleniyor...</div>}
        {!loading && loadError && !showNotes && (
          <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            {loadError}
          </div>
        )}
        {!loading && data && !showNotes && (
          <>
            {data.modernizedAt && (
              <div className="flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                <div className="text-emerald-800 dark:text-emerald-200">
                  {showOriginal
                    ? "Orijinal (eski Türkçe) metin gösteriliyor."
                    : "Metin günümüz Türkçesine sadeleştirildi."}
                </div>
                <button
                  onClick={() => setShowOriginal((v) => !v)}
                  className="px-2 py-1 rounded border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                >
                  {showOriginal ? "Sadeleştirilmişe dön" : "Orijinali göster"}
                </button>
              </div>
            )}
            <TafsirContentView
              surahId={surahId}
              ayahNo={ayahNo}
              tafsirId={data.tafsir.id}
              tafsirName={data.tafsir.name}
              text={showOriginal && data.originalText ? data.originalText : data.text}
              highlights={
                showOriginal && data.originalText ? [] : data.highlights /* offsets güncel metne göre */
              }
              notes={showOriginal && data.originalText ? [] : data.notes}
              onSelectionChange={setActiveSelection}
              onHighlightClick={deleteHighlight}
              onNoteClick={(n) => setEditingNote(n)}
              onAddNoteAt={(position, anchorText) => {
                if (!requireAuth()) return;
                setDraftNote({ position, anchorText });
              }}
              hiddenNoteIds={hiddenNoteIds}
              onToggleNoteHidden={toggleNoteHidden}
              focusHighlightId={focusHighlightId}
              focusNoteId={focusNoteId}
              focusFind={focusFind}
            />
          </>
        )}
        {!loading && showNotes && (
          <NotesPanel
            surahId={surahId}
            ayahNo={ayahNo}
            ayahId={ayahId}
            surahName={surahName}
            hiddenNoteIds={hiddenNoteIds}
            onToggleNoteHidden={toggleNoteHidden}
            onJump={(tafsirId) => {
              onShowNotesChange(false);
              setPreferredTafsirId(tafsirId);
              onSelectedIdChange(tafsirId);
            }}
          />
        )}
      </main>

      {/* Sağ — vurgu/not araçları (sabit) */}
      <aside className="md:sticky md:top-[130px] md:self-start md:max-h-[calc(100vh-150px)] md:overflow-y-auto">
        <AnnotationTools
          selection={activeSelection}
          onHighlight={createHighlight}
          onAddNote={startNoteFromSelection}
          highlights={data?.highlights ?? []}
          notes={data?.notes ?? []}
          hiddenNoteIds={hiddenNoteIds}
          onToggleNoteHidden={toggleNoteHidden}
          onHighlightClick={deleteHighlight}
          onNoteClick={(n) => setEditingNote(n)}
        />
      </aside>

      {/* Not modal'ları */}
      {draftNote && (
        <NoteEditor
          initialBody=""
          onCancel={() => {
            setDraftNote(null);
            setDraftHideOnSave(false);
          }}
          onSave={(body) => saveDraftNote(body, draftHideOnSave)}
          title="Yeni not"
          anchorText={draftNote.anchorText}
          hideOnSave={draftHideOnSave}
          onHideOnSaveChange={setDraftHideOnSave}
        />
      )}
      {editingNote && (
        <NoteEditor
          initialBody={editingNote.body}
          onCancel={() => setEditingNote(null)}
          onSave={(body) => {
            updateNote(editingNote.id, body);
            setEditingNote(null);
          }}
          onDelete={() => deleteNote(editingNote.id)}
          title="Notu düzenle"
          anchorText={editingNote.anchorText}
          hidden={hiddenNoteIds.has(editingNote.id)}
          onToggleHidden={() => toggleNoteHidden(editingNote.id)}
        />
      )}
    </div>
  );
}

function NoteEditor({
  initialBody,
  onCancel,
  onSave,
  onDelete,
  hidden,
  onToggleHidden,
  hideOnSave,
  onHideOnSaveChange,
  title,
  anchorText,
}: {
  initialBody: string;
  onCancel: () => void;
  onSave: (body: string) => void | Promise<void>;
  onDelete?: () => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
  /** Yeni not: kaydedince gizli olsun */
  hideOnSave?: boolean;
  onHideOnSaveChange?: (v: boolean) => void;
  title: string;
  anchorText: string;
}) {
  const [body, setBody] = useState(initialBody);
  const showHideToggle = onToggleHidden != null || onHideOnSaveChange != null;
  const isHidden = onToggleHidden != null ? hidden : hideOnSave;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-lg p-5 border border-stone-200 dark:border-stone-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">{title}</h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 italic">
          &ldquo;…{anchorText}…&rdquo;
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700"
          placeholder="Notunuzu yazın..."
          autoFocus
        />
        <div className="flex justify-between mt-3">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-700 dark:text-red-400 text-sm hover:underline"
              >
                Sil
              </button>
            )}
            {showHideToggle && (
              <button
                type="button"
                onClick={() => {
                  if (onToggleHidden) onToggleHidden();
                  else if (onHideOnSaveChange) onHideOnSaveChange(!hideOnSave);
                }}
                className={`ml-3 text-sm hover:underline ${
                  isHidden
                    ? "text-amber-700 dark:text-amber-300 font-medium"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {isHidden
                  ? onToggleHidden
                    ? "Gizlemeyi kaldır"
                    : "Kaydedince gizli ✓"
                  : onToggleHidden
                  ? "Gizle"
                  : "Kaydedince gizle"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded border border-stone-300 dark:border-stone-700"
            >
              İptal
            </button>
            <button
              onClick={() => onSave(body.trim())}
              disabled={!body.trim()}
              className="px-3 py-1.5 text-sm rounded bg-emerald-700 text-white disabled:opacity-50 hover:bg-emerald-800"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
