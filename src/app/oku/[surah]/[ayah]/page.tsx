import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OkuReaderShell } from "@/components/OkuReaderShell";

type RouteParams = { surah: string; ayah: string };
type SearchParams = { tafsir?: string; hl?: string; note?: string; flash?: string; find?: string };

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
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);
  if (Number.isNaN(sId) || Number.isNaN(aNo)) notFound();

  const surahMeta = await prisma.surah.findUnique({ where: { id: sId } });
  if (!surahMeta) notFound();
  if (aNo < 1 || aNo > surahMeta.ayetCount) {
    redirect(`/oku/${sId}/1`);
  }

  const ayet = await prisma.ayah.findUnique({
    where: { surahId_number: { surahId: sId, number: aNo } },
  });
  if (!ayet) notFound();

  const allSurahs = await prisma.surah.findMany({
    orderBy: { id: "asc" },
    select: { id: true, nameTr: true, ayetCount: true },
  });
  const allTafsirs = await prisma.tafsir.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      author: true,
      deathYearHijri: true,
      deathYearGregorian: true,
    },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6">
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
          focusHighlightId={focusHighlight}
          focusNoteId={focusNote}
          focusFind={focusFind}
          flash={flash}
        />
      </Suspense>
    </div>
  );
}
