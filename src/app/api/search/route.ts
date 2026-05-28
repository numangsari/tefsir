export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const MAX_PER_SECTION = 20;
const ALL_TYPES = ["surah", "meal", "tafsir", "note", "highlight"] as const;
type SearchType = (typeof ALL_TYPES)[number];

function parseTypes(raw: string | null): Set<SearchType> {
  if (!raw?.trim()) return new Set(ALL_TYPES);
  const parts = raw.split(",").map((s) => s.trim()) as SearchType[];
  const valid = parts.filter((p): p is SearchType => ALL_TYPES.includes(p));
  return valid.length > 0 ? new Set(valid) : new Set(ALL_TYPES);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const types = parseTypes(searchParams.get("types"));
  const filterSurahId = parseInt(searchParams.get("surahId") ?? "");
  const filterAyahNo = parseInt(searchParams.get("ayahNo") ?? "");
  const hasSurahFilter = !Number.isNaN(filterSurahId);
  const hasAyahFilter = !Number.isNaN(filterAyahNo);

  const empty = {
    surahs: [] as { id: number; nameTr: string; ayetCount: number }[],
    ayahs: [] as {
      surahId: number;
      surahName: string;
      number: number;
      text: string;
      source: string;
    }[],
    tafsirs: [] as {
      tafsirId: number;
      tafsirName: string;
      surahId: number;
      surahName: string;
      ayahNo: number;
      text: string;
    }[],
    notes: [] as {
      id: string;
      surahId: number;
      surahName: string;
      ayahNo: number;
      tafsirId: number;
      tafsirName: string;
      body: string;
    }[],
    highlights: [] as {
      id: string;
      surahId: number;
      surahName: string;
      ayahNo: number;
      tafsirId: number;
      tafsirName: string;
      text: string;
    }[],
  };

  if (q.length < 2) {
    return NextResponse.json(empty);
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const ayahWhere =
    hasSurahFilter || hasAyahFilter
      ? {
          ...(hasSurahFilter ? { surahId: filterSurahId } : {}),
          ...(hasAyahFilter ? { number: filterAyahNo } : {}),
        }
      : undefined;

  const surahs =
    types.has("surah") && !hasAyahFilter
      ? await prisma.surah.findMany({
          where: {
            nameTr: { contains: q },
            ...(hasSurahFilter ? { id: filterSurahId } : {}),
          },
          take: 15,
          orderBy: { id: "asc" },
          select: { id: true, nameTr: true, ayetCount: true },
        })
      : [];

  let ayahs = empty.ayahs;
  if (types.has("meal")) {
    const ayahMeal = await prisma.ayah.findMany({
      where: {
        meal: { contains: q },
        ...(ayahWhere ?? {}),
      },
      take: MAX_PER_SECTION,
      include: { surah: { select: { nameTr: true } } },
      orderBy: [{ surahId: "asc" }, { number: "asc" }],
    });

    const translations = await prisma.translation.findMany({
      where: {
        text: { contains: q },
        ...(ayahWhere
          ? { ayah: ayahWhere }
          : {}),
      },
      take: MAX_PER_SECTION,
      include: {
        edition: { select: { code: true, name: true } },
        ayah: { include: { surah: { select: { nameTr: true } } } },
      },
      orderBy: [{ ayahId: "asc" }],
    });

    const ayahMap = new Map<number, (typeof ayahs)[0]>();
    for (const a of ayahMeal) {
      ayahMap.set(a.id, {
        surahId: a.surahId,
        surahName: a.surah.nameTr,
        number: a.number,
        text: a.meal,
        source: "Diyanet",
      });
    }
    for (const t of translations) {
      if (ayahMap.has(t.ayahId)) continue;
      ayahMap.set(t.ayahId, {
        surahId: t.ayah.surahId,
        surahName: t.ayah.surah.nameTr,
        number: t.ayah.number,
        text: t.text,
        source: t.edition.name,
      });
    }
    ayahs = Array.from(ayahMap.values()).slice(0, MAX_PER_SECTION);
  }

  let tafsirs = empty.tafsirs;
  if (types.has("tafsir")) {
    const tafsirRows = await prisma.tafsirContent.findMany({
      where: {
        text: { contains: q },
        ...(ayahWhere ? { ayah: ayahWhere } : {}),
      },
      take: MAX_PER_SECTION,
      include: {
        tafsir: { select: { id: true, name: true } },
        ayah: { select: { surahId: true, number: true, surah: { select: { nameTr: true } } } },
      },
      orderBy: [{ ayahId: "asc" }],
    });
    tafsirs = tafsirRows.map((r) => ({
      tafsirId: r.tafsir.id,
      tafsirName: r.tafsir.name,
      surahId: r.ayah.surahId,
      surahName: r.ayah.surah.nameTr,
      ayahNo: r.ayah.number,
      text: r.text,
    }));
  }

  let notes = empty.notes;
  let highlights = empty.highlights;
  if (userId) {
    if (types.has("note")) {
      const noteRows = await prisma.note.findMany({
        where: {
          userId,
          body: { contains: q },
          ...(ayahWhere ? { ayah: ayahWhere } : {}),
        },
        take: MAX_PER_SECTION,
        select: {
          id: true,
          tafsirId: true,
          body: true,
          tafsir: { select: { name: true } },
          ayah: { select: { surahId: true, number: true, surah: { select: { nameTr: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      notes = noteRows.map((n) => ({
        id: n.id,
        surahId: n.ayah.surahId,
        surahName: n.ayah.surah.nameTr,
        ayahNo: n.ayah.number,
        tafsirId: n.tafsirId,
        tafsirName: n.tafsir.name,
        body: n.body,
      }));
    }
    if (types.has("highlight")) {
      const hlRows = await prisma.highlight.findMany({
        where: {
          userId,
          text: { contains: q },
          ...(ayahWhere ? { ayah: ayahWhere } : {}),
        },
        take: MAX_PER_SECTION,
        select: {
          id: true,
          tafsirId: true,
          text: true,
          tafsir: { select: { name: true } },
          ayah: { select: { surahId: true, number: true, surah: { select: { nameTr: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      highlights = hlRows.map((h) => ({
        id: h.id,
        surahId: h.ayah.surahId,
        surahName: h.ayah.surah.nameTr,
        ayahNo: h.ayah.number,
        tafsirId: h.tafsirId,
        tafsirName: h.tafsir.name,
        text: h.text,
      }));
    }
  }

  return NextResponse.json({ surahs, ayahs, tafsirs, notes, highlights });
}