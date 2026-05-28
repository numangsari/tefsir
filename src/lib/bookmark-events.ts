/** Yer imi değişince tüm bileşenlerin güncellenmesi için olay */
export type BookmarkData = {
  surahId: number;
  surahName: string;
  ayahNo: number;
  tafsirId: number | null;
  tafsirName: string | null;
  at: string | null;
};

export const BOOKMARK_EVENT = "tefsir-bookmark-change";

export function emitBookmarkChange(bookmark: BookmarkData | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT, { detail: bookmark }));
}

export async function fetchBookmark(): Promise<BookmarkData | null> {
  const r = await fetch("/api/my/bookmark", { cache: "no-store" });
  if (!r.ok) return null;
  const d = (await r.json()) as { bookmark: BookmarkData | null };
  return d.bookmark;
}
