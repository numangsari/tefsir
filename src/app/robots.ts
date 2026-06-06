import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Kişisel/yönetim sayfaları aramaya kapalı
        disallow: ["/yonetici", "/panel", "/profil", "/api/", "/yazdir/"],
      },
    ],
    sitemap: "https://tefsir.net/sitemap.xml",
    host: "https://tefsir.net",
  };
}
