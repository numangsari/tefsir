import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OkuReaderShell } from "@/components/OkuReaderShell";
import type { TafsirData } from "@/components/TafsirReader";
import { JsonLd } from "@/components/JsonLd";
import { cleanTafsirText } from "@/lib/clean-tafsir-text";
import {
  getAllSurahs,
  getAyah,
  getAyahTafsirs,
  getModernizedTafsirRaw,
  getSurah,
} from "@/lib/reader-data";

type RouteParams = { surah: string; ayah: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { surah, ayah } = await params;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  if (Number.isNaN(sId) || Number.isNaN(aNo)) return {};

  // Sûre + ayet + ince-sayfa kontrolü paralel (sûre/ayet sorguları React cache ile
  // sayfa gövdesiyle paylaşılır → tekrar round-trip yok).
  const [s, ayet, contentCount] = await Promise.all([
    getSurah(sId),
    getAyah(sId, aNo),
    // Sadeleştirilmiş tefsir içeriği olmayan ayet sayfaları "ince"dir → noindex
    // (Google indekslemesin ama linkleri takip etsin: follow). İçerik eklenince indekslenir.
    prisma.tafsirContent.count({
      where: { ayah: { surahId: sId, number: aNo }, modernizedAt: { not: null } },
    }),
  ]);
  if (!s) return {};

  const title = `${s.nameTr} Sûresi ${aNo}. ayet`;
  const meal = ayet?.meal?.replace(/\s+/g, " ").trim();
  const description = meal
    ? `${title} meali ve 11 klasik Türkçe tefsiri. “${meal.slice(0, 150)}${
        meal.length > 150 ? "…" : ""
      }”`
    : `${title} meali ve klasik Türkçe tefsirleri.`;

  return {
    title,
    description,
    alternates: { canonical: `/oku/${sId}/${aNo}` },
    openGraph: { title: `${title} · tefsir.net`, description, type: "article" },
    robots: contentCount === 0 ? { index: false, follow: true } : undefined,
  };
}
type SearchParams = {
  tafsir?: string;
  hl?: string;
  note?: string;
  flash?: string;
  find?: string;
  pos?: string;
};

export default async function AyahPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { surah, ayah } = await params;
  const sp = await searchParams;
  const focusTafsirId = sp.tafsir ? parseInt(sp.tafsir) : undefined;
  const focusHighlight = sp.hl ?? undefined;
  const focusNote = sp.note ?? undefined;
  const flash = sp.flash ?? undefined;
  const focusFind = sp.find ? decodeURIComponent(sp.find) : undefined;
  const focusOffset = sp.pos ? parseInt(sp.pos) : undefined;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  if (Number.isNaN(sId) || Number.isNaN(aNo)) notFound();

  // Birbirinden bağımsız üç sorgu paralel. surah/ayah React cache ile generateMetadata
  // ile paylaşılır; allSurahs istekler arası önbellekten gelir.
  const [surahMeta, ayet, allSurahs] = await Promise.all([
    getSurah(sId),
    getAyah(sId, aNo),
    getAllSurahs(),
  ]);
  if (!surahMeta) notFound();
  if (aNo < 1 || aNo > surahMeta.ayetCount) {
    redirect(`/oku/${sId}/1`);
  }
  if (!ayet) notFound();

  // Sol panelde yalnızca bu ayet için AI ile sadeleştirilmiş (modernizedAt dolu)
  // içeriği olan tefsirler listelenir. Henüz sadeleştirilmemiş tefsirler veritabanında
  // durur ama sitede görünmez.
  const allTafsirs = await getAyahTafsirs(ayet.id);

  // SSR seed: sunucunun bildiği varsayılan tefsirin metnini sayfayla birlikte gönder
  // → istemci, açılışta ayrı bir fetch turu beklemeden metni anında gösterir.
  // Varsayılan = URL ?tafsir= (geçerliyse), yoksa ilk tefsir. (sessionStorage tercihi
  // istemcide olduğundan burada bilinemez; farklıysa istemci kendi yükler.)
  let initialTafsir: TafsirData | null = null;
  const seedId =
    focusTafsirId && allTafsirs.some((t) => t.id === focusTafsirId)
      ? focusTafsirId
      : allTafsirs[0]?.id;
  if (seedId) {
    const raw = await getModernizedTafsirRaw(seedId, ayet.id);
    if (raw) {
      const { text, trimStart } = cleanTafsirText(raw.text, aNo);
      initialTafsir = {
        tafsir: { id: raw.tafsirId, code: raw.code, name: raw.name },
        text,
        textTrimStart: trimStart,
        modernizedAt: raw.modernizedAt,
        modernizedBy: raw.modernizedBy,
        highlights: [],
        notes: [],
      };
    }
  }

  const canonical = `https://tefsir.net/oku/${sId}/${aNo}`;
  const ayahJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${surahMeta.nameTr} Sûresi ${aNo}. ayet`,
      inLanguage: "tr",
      mainEntityOfPage: canonical,
      url: canonical,
      about: "Kur'an-ı Kerim tefsiri",
      isPartOf: { "@type": "WebSite", name: "tefsir.net", url: "https://tefsir.net" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "tefsir.net", item: "https://tefsir.net" },
        { "@type": "ListItem", position: 2, name: "Sûreler", item: "https://tefsir.net/sureler" },
        {
          "@type": "ListItem",
          position: 3,
          name: `${surahMeta.nameTr} Sûresi`,
          item: `https://tefsir.net/oku/${sId}/1`,
        },
        { "@type": "ListItem", position: 4, name: `${aNo}. ayet`, item: canonical },
      ],
    },
  ];

  // Taranabilir önceki/sonraki ayet linkleri (sûre sınırında komşu sûreye geçer).
  // Google bu zinciri izleyerek tüm ayet sayfalarını keşfeder.
  let prevHref: string | null = null;
  if (aNo > 1) prevHref = `/oku/${sId}/${aNo - 1}`;
  else if (sId > 1) {
    const ps = allSurahs.find((x) => x.id === sId - 1);
    if (ps) prevHref = `/oku/${sId - 1}/${ps.ayetCount}`;
  }
  let nextHref: string | null = null;
  if (aNo < surahMeta.ayetCount) nextHref = `/oku/${sId}/${aNo + 1}`;
  else if (sId < 114) nextHref = `/oku/${sId + 1}/1`;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6">
      <JsonLd data={ayahJsonLd} />
      <Suspense fallback={<div className="py-8 text-stone-500">Yükleniyor…</div>}>
        <OkuReaderShell
          surahMeta={surahMeta}
          ayahNo={ayet.number}
          ayahId={ayet.id}
          arabic={ayet.arabic}
          meal={ayet.meal}
          allSurahs={allSurahs}
          surahName={surahMeta.nameTr}
          tafsirs={allTafsirs}
          initialTafsirId={focusTafsirId}
          initialTafsir={initialTafsir}
          focusHighlightId={focusHighlight}
          focusNoteId={focusNote}
          focusFind={focusFind}
          focusOffset={focusOffset}
          flash={flash}
        />
      </Suspense>

      {/* Taranabilir gezinme — SEO için gerçek <a> linkleri (breadcrumb + komşu ayetler) */}
      <nav
        aria-label="Ayet gezinme"
        className="mt-8 border-t border-stone-200 dark:border-stone-800 pt-4"
      >
        <div className="text-xs text-stone-500 dark:text-stone-400">
          <Link href="/sureler" className="hover:text-emerald-700 dark:hover:text-emerald-300">
            Sûreler
          </Link>
          <span className="mx-1.5">›</span>
          <Link
            href={`/oku/${sId}/1`}
            className="hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            {surahMeta.nameTr} Sûresi
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-stone-700 dark:text-stone-300">{aNo}. ayet</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          {prevHref ? (
            <Link
              href={prevHref}
              rel="prev"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-700 dark:text-stone-200 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <span aria-hidden>←</span> Önceki ayet
            </Link>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              rel="next"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-stone-700 dark:text-stone-200 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Sonraki ayet <span aria-hidden>→</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </nav>
    </div>
  );
}
