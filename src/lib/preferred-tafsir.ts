/** Kullanıcının son seçtiği tefsir — ayet değişiminde korunur */
const STORAGE_KEY = "tefsir.preferredTafsirId";

export function getPreferredTafsirId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function setPreferredTafsirId(id: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, String(id));
}

export function resolveInitialTafsirId(
  tafsirs: { id: number }[],
  urlTafsirId?: number
): number | null {
  if (tafsirs.length === 0) return null;
  if (urlTafsirId && tafsirs.some((t) => t.id === urlTafsirId)) return urlTafsirId;
  const preferred = getPreferredTafsirId();
  if (preferred && tafsirs.some((t) => t.id === preferred)) return preferred;
  return tafsirs[0].id;
}
