import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

export const metadata: Metadata = {
  title: "Tefsir Projesi",
  description: "Kur'an-ı Kerim ayet ayet tefsir okuyucu ve not defteri",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
