"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Her sayfa/route değişiminde /api/track'e çerezsiz bir ziyaret pingi gönderir.
// Yönetici sayfaları sayılmaz (kendi trafiğimiz istatistiği şişirmesin).
export function AnalyticsTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/yonetici")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // sessizce yut
    }
  }, [pathname]);

  return null;
}
