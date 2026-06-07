"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useSession } from "next-auth/react";
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

export type TafsirData = {
  tafsir: { id: number; code: string; name: string };
  text: string;
  /** Ham metnin başından temizlenen karakter sayısı (offset dönüşümü için) */
  textTrimStart: number;
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
  initialTafsir,
  onSelectedIdChange,
  showNotes,
  onShowNotesChange,
  onAdvance,
  focusHighlightId,
  focusNoteId,
  focusFind,
  focusOffset,
  flash,
}: {
  surahId: number;
  ayahNo: number;
  ayahId: number;
  surahName: string;
  tafsirs: TafsirSummary[];
  selectedId: number | null;
  /** Sunucuda hazırlanan varsayılan tefsir metni (SSR seed) — açılış hızı için */
  initialTafsir?: TafsirData | null;
  onSelectedIdChange: (id: number) => void;
  showNotes: boolean;
  onShowNotesChange: (v: boolean) => void;
  /** Verilen tefsirden bir sonrakine; o son tefsirse sıradaki ayete geçer */
  onAdvance: (fromTafsirId: number | null) => void;
  focusHighlightId?: string;
  focusNoteId?: string;
  focusFind?: string;
  /** "Burada kaldım" geri dönüşünde metinde kaydırılacak karakter offset'i */
  focusOffset?: number;
  flash?: string;
}) {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [readTafsirIds, setReadTafsirIds] = useState<Set<number>>(new Set());
  const [flashTafsirRing, setFlashTafsirRing] = useState(false);
  // SSR seed bu açılışta seçili tefsire aitse, metni anında göster (fetch beklemeden).
  const [data, setData] = useState<TafsirData | null>(() =>
    initialTafsir && initialTafsir.tafsir.id === selectedId ? initialTafsir : null
  );
  // Sunucudan gelen seed'in tefsir id'si — ilk yüklemede gereksiz fetch turunu atlamak için
  const seededId = useRef<number | null>(initialTafsir?.tafsir.id ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hiddenNoteIds, setHiddenNoteIds] = useState<Set<string>>(new Set());
  // Mobil sekmeli düzen: aynı anda yalnız bir bölme görünür (masaüstünde üçü de grid'te).
  const [mobilePane, setMobilePane] = useState<"list" | "text" | "tools">("text");

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
      // Başka tefsire geçiliyorsa eski metni temizle (spinner görünsün). Aynı tefsir
      // için (SSR seed metnini not/vurgu ile tazeleme) metni koru → ekran boşalmaz.
      setData((prev) => (prev && prev.tafsir.id === tafsirId ? prev : null));
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
    if (selectedId == null) return;
    // SSR seed bu tefsire ait ve metin zaten ekranda ise:
    if (seededId.current === selectedId && data?.tafsir.id === selectedId) {
      // Misafir → not/vurgu yok, fetch turuna hiç gerek yok.
      if (status === "unauthenticated") return;
      // Oturum henüz çözülmedi → metin görünürken çözülmesini bekle (boşuna fetch yok).
      if (status === "loading") return;
      // Girişli kullanıcı → metin görünüyor; not/vurgular için arka planda tazele.
    }
    loadTafsir(selectedId);
    // data kasıtlı olarak bağımlılıkta değil: yalnızca ilk yükleme/seçim/oturum
    // değişiminde karar verilir, her data güncellemesinde değil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loadTafsir, status]);

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
    // Offset'ler temiz metne göre; DB'ye ham koordinatla (textTrimStart eklenerek) yazılır
    const trim = data.textTrimStart;
    const r = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tafsirId: data.tafsir.id,
        ayahId,
        startOffset: activeSelection.start + trim,
        endOffset: activeSelection.end + trim,
        color,
        text: activeSelection.snippet,
      }),
    });
    if (r.ok) {
      const saved = (await r.json()) as Highlight;
      // Yerel görünüm temiz metne göre olduğundan ham koordinattan geri çevrilir
      const newHl: Highlight = {
        ...saved,
        startOffset: saved.startOffset - trim,
        endOffset: saved.endOffset - trim,
      };
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
    const trim = data.textTrimStart;
    const r = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tafsirId: data.tafsir.id,
        ayahId,
        position: draftNote.position + trim,
        anchorText: draftNote.anchorText,
        body,
      }),
    });
    if (r.ok) {
      const saved = (await r.json()) as Note;
      const newNote: Note = { ...saved, position: saved.position - trim };
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

  async function persistReadMark(tafsirId: number, value: boolean) {
    const r = await fetch("/api/my/tafsir-reads", {
      method: value ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surahId, ayahNo, tafsirId }),
    });
    if (r.ok) {
      setReadTafsirIds((prev) => {
        const next = new Set(prev);
        if (value) next.add(tafsirId);
        else next.delete(tafsirId);
        return next;
      });
      return true;
    }
    toast.error("Okundu işareti kaydedilemedi.");
    return false;
  }

  // OKU butonu: işaretle/kaldır; yeni okundu işaretlendiyse sıradakine geç
  async function toggleReadMark(tafsirId: number) {
    if (!requireAuth()) return;
    const marked = readTafsirIds.has(tafsirId);
    const ok = await persistReadMark(tafsirId, !marked);
    if (ok && !marked) onAdvance(tafsirId);
  }

  // "Sıradaki" butonu: mevcut tefsiri (girişliyse) sessizce okundu yapıp ilerle
  async function handleSiradaki() {
    if (
      selectedId != null &&
      status === "authenticated" &&
      !readTafsirIds.has(selectedId)
    ) {
      await persistReadMark(selectedId, true);
    }
    onAdvance(selectedId);
  }

  // Listeden vurgu/nota tıklanınca metinde o öğeye kaydır + kısa vurgu efekti
  function jumpToAnchor(domId: string) {
    const el = document.getElementById(domId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-amber-500", "rounded-sm");
    window.setTimeout(
      () => el.classList.remove("ring-2", "ring-amber-500", "rounded-sm"),
      2000
    );
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
    <div className="mt-4 md:grid md:grid-cols-[230px_1fr_300px] gap-4 pb-20 md:pb-0">
      {/* Sol panel — bağımsız scroll */}
      <aside
        className={`${
          mobilePane === "list" ? "block" : "hidden"
        } md:block md:sticky md:top-[calc(var(--ayah-sticky-h,140px)+12px)] md:self-start md:max-h-[calc(100vh-var(--ayah-sticky-h,140px)-28px)] md:overflow-y-auto pr-1`}
      >
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
                    : "bg-white/60 dark:bg-stone-900/50 backdrop-blur-sm border-stone-200/70 dark:border-white/10 hover:border-emerald-400/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onShowNotesChange(false);
                    setPreferredTafsirId(t.id);
                    onSelectedIdChange(t.id);
                    setMobilePane("text");
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
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-full border-2 transition-all ${
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
        className={`${
          mobilePane === "text" ? "block" : "hidden"
        } md:block bg-white/85 dark:bg-stone-900/70 backdrop-blur-md border border-stone-200/70 dark:border-white/10 rounded-2xl p-4 sm:p-6 min-h-[60vh] shadow-[0_12px_44px_-22px_rgba(0,0,0,0.5)] transition-shadow ${
          flashTafsirRing ? "ring-2 ring-amber-500" : ""
        }`}
      >
        {loading && !data && (
          <div className="text-stone-500 dark:text-stone-400">Yükleniyor...</div>
        )}
        {loadError && !data && !showNotes && (
          <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            {loadError}
          </div>
        )}
        {data && !showNotes && (
          <>
            {data.modernizedAt && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                <div className="text-emerald-800 dark:text-emerald-200">
                  Metin günümüz Türkçesine sadeleştirildi, hata bulunabilir.
                </div>
              </div>
            )}
            <TafsirContentView
              surahId={surahId}
              ayahNo={ayahNo}
              tafsirId={data.tafsir.id}
              tafsirName={data.tafsir.name}
              text={data.text}
              highlights={data.highlights}
              notes={data.notes}
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
              scrollToOffset={focusOffset}
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
        {/* Mobil: "Sıradaki" metin bölmesinin altında (sağ panel masaüstüne özel) */}
        {!showNotes && selectedId != null && (
          <div className="mt-6 md:hidden">
            <button
              type="button"
              onClick={handleSiradaki}
              className="w-full btn-glow px-4 py-3 text-sm"
            >
              {tafsirs.findIndex((t) => t.id === selectedId) === tafsirs.length - 1
                ? "Sıradaki ayet"
                : "Sıradaki tefsir"}
              <span aria-hidden>→</span>
            </button>
          </div>
        )}
      </main>

      {/* Sağ — vurgu/not araçları (sabit) + sıradaki butonu (panelin altına sabit) */}
      <aside
        className={`${
          mobilePane === "tools" ? "block" : "hidden"
        } md:block md:sticky md:top-[calc(var(--ayah-sticky-h,140px)+12px)] md:self-start md:max-h-[calc(100vh-var(--ayah-sticky-h,140px)-28px)] md:flex md:flex-col md:min-h-0`}
      >
        <div className="md:flex-1 md:overflow-y-auto md:min-h-0 md:pr-1">
          <AnnotationTools
            selection={activeSelection}
            onHighlight={createHighlight}
            onAddNote={startNoteFromSelection}
            highlights={data?.highlights ?? []}
            notes={data?.notes ?? []}
            hiddenNoteIds={hiddenNoteIds}
            onToggleNoteHidden={toggleNoteHidden}
            onHighlightClick={deleteHighlight}
            onHighlightJump={(id) => jumpToAnchor(`hl-${id}`)}
            onNoteJump={(id) => jumpToAnchor(`note-${id}`)}
          />
        </div>
        {!showNotes && selectedId != null && (
          <div className="mt-3 shrink-0 hidden md:block">
            <button
              type="button"
              onClick={handleSiradaki}
              className="w-full btn-glow px-4 py-2.5 text-sm"
            >
              {tafsirs.findIndex((t) => t.id === selectedId) === tafsirs.length - 1
                ? "Sıradaki ayet"
                : "Sıradaki tefsir"}
              <span aria-hidden>→</span>
            </button>
          </div>
        )}
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

      {/* Mobil alt sekme çubuğu — Tefsirler / Metin / Araçlar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-stone-200/70 dark:border-white/10 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        {(
          [
            { key: "list", label: "Tefsirler", icon: "☰" },
            { key: "text", label: "Metin", icon: "📖" },
            { key: "tools", label: "Araçlar", icon: "✎" },
          ] as { key: "list" | "text" | "tools"; label: string; icon: string }[]
        ).map((t) => {
          const active = mobilePane === t.key;
          const toolsCount =
            (data?.highlights.length ?? 0) + (data?.notes.length ?? 0);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMobilePane(t.key)}
              aria-current={active ? "page" : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {t.icon}
              </span>
              {t.label}
              {t.key === "tools" && toolsCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] leading-4 text-center">
                  {toolsCount}
                </span>
              )}
              {active && (
                <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </nav>
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
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onCancel}>
      <div
        className="surface-glass shadow-glow-lg w-full max-w-lg p-5 animate-fade-up"
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
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
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
              className="px-4 py-1.5 text-sm btn-outline-glow"
            >
              İptal
            </button>
            <button
              onClick={() => onSave(body.trim())}
              disabled={!body.trim()}
              className="px-4 py-1.5 text-sm btn-glow disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
