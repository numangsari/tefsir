"use client";

/**
 * "Burada kaldım" için okunan tefsirdeki dikey konumu (karakter offset'i) yakalar
 * ve cihaz yerelinde (localStorage) saklar. Bookmark'ın kendisi sunucuda tutulur;
 * yalnızca tam kaydırma konumu bu cihaza özeldir (başka cihazda baştan açılır).
 */

const PREFIX = "tefsir-resume:";

export function resumeScrollKey(
  surahId: number,
  ayahNo: number,
  tafsirId: number | null
): string {
  return `${PREFIX}${surahId}:${ayahNo}:${tafsirId ?? 0}`;
}

export function saveResumeScroll(key: string, offset: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(offset));
  } catch {
    /* kota/private mode — yok say */
  }
}

export function getResumeScroll(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key);
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearResumeScroll(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* yok say */
  }
}

/**
 * Okuyucudaki tefsir gövdesinin (`.tefsir-body`) görünür üst kenarındaki karakter
 * offset'ini döndürür. Sticky başlığın altındaki ilk satır esas alınır.
 */
export function captureTafsirScrollOffset(): number {
  if (typeof document === "undefined") return 0;
  const body = document.querySelector(".tefsir-body") as HTMLElement | null;
  if (!body) return 0;

  const rect = body.getBoundingClientRect();
  const headerH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--ayah-sticky-h")
    ) || 150;
  const x = rect.left + 8;
  const y = headerH + 16;

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
    const r = docAny.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      nodeOffset = r.startOffset;
    }
  } else if (docAny.caretPositionFromPoint) {
    const c = docAny.caretPositionFromPoint(x, y);
    if (c) {
      node = c.offsetNode;
      nodeOffset = c.offset;
    }
  }

  if (!node || !body.contains(node)) return 0;
  if (node.nodeType !== Node.TEXT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (!first) return 0;
    node = first;
    nodeOffset = 0;
  }

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let total = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (n === node) return total + nodeOffset;
    total += n.data.length;
  }
  return 0;
}
