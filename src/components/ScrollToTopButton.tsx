"use client";

import { useEffect, useState } from "react";

/** Sayfa aşağı kaydırıldığında beliren, en üste döndüren yüzen buton. */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      // Sayfanın en altına yaklaşınca gizle (alttaki önceki/sonraki ayet
      // gezinmesiyle çakışmasın); biraz yukarı kaydırınca tekrar belirir.
      const nearBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 140;
      setVisible(y > 400 && !nearBottom);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="En üste çık"
      title="En üste çık"
      className="fixed bottom-6 left-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg ring-1 ring-black/5 hover:bg-emerald-800 transition-colors"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
