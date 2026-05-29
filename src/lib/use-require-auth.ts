"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toaster";

/**
 * Misafir (giriş yapmamış) kullanıcı kişisel bir eylem denediğinde
 * — not, vurgu, "burada kaldım", "okudum" — bir uyarı gösterir.
 * Kullanıcıyı sayfadan ATMAZ; okuduğu yerde kalır.
 *
 * Dönen fonksiyon:
 *   - giriş yapılmışsa (veya oturum henüz yükleniyorsa) true → eyleme devam et
 *   - misafirse false → eylem iptal (yalnızca uyarı gösterildi)
 */
export function useRequireAuth() {
  const { status } = useSession();
  const toast = useToast();

  return useCallback(() => {
    if (status === "unauthenticated") {
      toast.info("Bu özellik için giriş yapmalısınız.");
      return false;
    }
    return true;
  }, [status, toast]);
}
