import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://tefsir.net"),
  title: {
    default: "tefsir.net — Kur'an-ı Kerim tefsir okuyucu",
    template: "%s · tefsir.net",
  },
  description:
    "Kur'an-ı Kerim'i 11 klasik Türkçe tefsir üzerinden ayet ayet okuyun. Günümüz Türkçesine sadeleştirilmiş metin, vurgu ve not alma ile anlayarak okuma.",
  applicationName: "tefsir.net",
  keywords: [
    "tefsir",
    "Kur'an tefsiri",
    "Kuran meali",
    "Türkçe tefsir",
    "ayet meali",
    "sure tefsiri",
    "Taberî tefsiri",
    "Kurtubî tefsiri",
    "Fahreddin Râzî",
    "Kur'an oku",
  ],
  authors: [{ name: "tefsir.net" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "tefsir.net",
    locale: "tr_TR",
    url: "https://tefsir.net",
    title: "tefsir.net — Kur'an-ı Kerim tefsir okuyucu",
    description:
      "11 klasik Türkçe tefsiri ayet ayet, sadeleştirilmiş ve anlaşılır biçimde okuyun.",
  },
  twitter: {
    card: "summary",
    title: "tefsir.net — Kur'an-ı Kerim tefsir okuyucu",
    description: "11 klasik Türkçe tefsiri ayet ayet, sadeleştirilmiş biçimde okuyun.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // Google Search Console doğrulama kodu (env verilirse onu kullanır)
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION ??
      "HVa1PXwwAujvd2xa4bixm3niFnGCge3Evs_OEKZ75ww",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#065f46", // emerald-800 (üst çubukla uyumlu)
};

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "tefsir.net",
    alternateName: "Tefsir.net Kur'an-ı Kerim tefsir okuyucu",
    url: "https://tefsir.net",
    inLanguage: "tr",
    // Google sitelinks arama kutusu: site adı aratınca site içi arama kutusu çıkar
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://tefsir.net/arama?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "tefsir.net",
    url: "https://tefsir.net",
    logo: "https://tefsir.net/icon.svg",
  },
];

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
        <JsonLd data={siteJsonLd} />
        <Providers>{children}</Providers>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
