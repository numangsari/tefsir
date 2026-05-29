"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PROTECTED = ["/panel", "/profil", "/yonetici"];

function isProtected(path: string) {
  return PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
}

/** bfcache / geri tuşu sonrası oturumu yeniden doğrular */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) void update();
    }
    function onVisible() {
      if (document.visibilityState === "visible") void update();
    }
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [update]);

  useEffect(() => {
    if (status === "unauthenticated" && pathname && isProtected(pathname)) {
      router.replace("/");
    }
  }, [status, pathname, router]);

  return <>{children}</>;
}
