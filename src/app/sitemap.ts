import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Günde bir yeniden üret (içerik sadeleştirildikçe yeni ayet sayfaları eklenir)
export const revalidate = 86400;

const BASE = "https://tefsir.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/oku`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/sureler`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/arama`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Yalnızca sadeleştirilmiş tefsir içeriği olan ayet sayfaları indekslenir
  // (boş/ince sayfalar siteye eklenmez).
  let ayahPages: MetadataRoute.Sitemap = [];
  try {
    const contents = await prisma.tafsirContent.findMany({
      where: { modernizedAt: { not: null } },
      select: { ayah: { select: { surahId: true, number: true } } },
      distinct: ["ayahId"],
    });
    const seen = new Set<string>();
    ayahPages = contents
      .map((c) => c.ayah)
      .filter((a): a is { surahId: number; number: number } => {
        if (!a) return false;
        const key = `${a.surahId}/${a.number}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.surahId - b.surahId || a.number - b.number)
      .map((a) => ({
        url: `${BASE}/oku/${a.surahId}/${a.number}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch {
    ayahPages = [];
  }

  return [...staticPages, ...ayahPages];
}
