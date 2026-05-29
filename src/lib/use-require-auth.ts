"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";

/**
 * Misafir (giriş yapmamış) kullanıcı kişisel bir eylem denediğinde
 * — not, vurgu, "burada kaldım", "okudum" — nazikçe giriş ekranına yönlendirir.
 *
 * Dönen fonksiyon:
 *   - giriş yapılmışsa (veya oturum henüz yükleniyorsa) true → eyleme devam et
 *   - misafirse false → eylem iptal, giriş ekranına yönlendirildi
 */
export function useRequireAuth() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  return useCallback(() => {
    if (status === "unauthenticated") {
      toast.info("Bu özellik için giriş yapın.");
      router.push(`/?callbackUrl=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }, [status, router, pathname, toast]);
}
