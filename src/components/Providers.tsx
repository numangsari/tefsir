"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "./Toaster";
import { SearchPalette } from "./SearchPalette";
import { SessionGuard } from "./SessionGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <SessionGuard>
        <ThemeProvider>
          <Toaster>
            {children}
            <SessionAwareSearch />
          </Toaster>
        </ThemeProvider>
      </SessionGuard>
    </SessionProvider>
  );
}

// Arama yalnız giriş yapmışken bağlansın; arama API auth ister
function SessionAwareSearch() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <SearchPalette />;
}
