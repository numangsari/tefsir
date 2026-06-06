import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { brandMarkDataUri, ogFonts, OG_SIZE } from "../../../_og/brand";

export const runtime = "nodejs";
export const alt = "tefsir.net — ayet meali ve tefsirleri";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function AyahOgImage({
  params,
}: {
  params: Promise<{ surah: string; ayah: string }>;
}) {
  const { surah, ayah } = await params;
  const sId = parseInt(surah);
  const aNo = parseInt(ayah);

  let surahName = "Kur'an-ı Kerim";
  let ayetCount: number | null = null;
  let meal = "";
  if (!Number.isNaN(sId) && !Number.isNaN(aNo)) {
    const s = await prisma.surah.findUnique({
      where: { id: sId },
      select: { nameTr: true, ayetCount: true },
    });
    if (s) {
      surahName = s.nameTr;
      ayetCount = s.ayetCount;
    }
    const ayet = await prisma.ayah.findUnique({
      where: { surahId_number: { surahId: sId, number: aNo } },
      select: { meal: true },
    });
    if (ayet?.meal) {
      const m = ayet.meal.replace(/\s+/g, " ").trim();
      meal = m.length > 170 ? m.slice(0, 170).trimEnd() + "…" : m;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          fontFamily: "PTSerif",
          color: "white",
        }}
      >
        {/* Üst: marka */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandMarkDataUri} width={56} height={56} alt="" style={{ marginRight: 16 }} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            <span>tefsir</span>
            <span style={{ color: "#FCD34D" }}>.net</span>
          </div>
        </div>

        {/* Orta: sûre + ayet */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
            {surahName} Sûresi
          </div>
          <div style={{ display: "flex", fontSize: 46, marginTop: 8, color: "#FCD34D" }}>
            {aNo}. ayet{ayetCount ? ` · ${ayetCount} ayet` : ""}
          </div>
          {meal ? (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                marginTop: 28,
                color: "#D1FAE5",
                fontWeight: 400,
                maxWidth: 1040,
                lineHeight: 1.4,
              }}
            >
              “{meal}”
            </div>
          ) : null}
        </div>

        {/* Alt: ibare */}
        <div style={{ display: "flex", fontSize: 28, color: "#A7F3D0", fontWeight: 400 }}>
          11 klasik Türkçe tefsir · sadeleştirilmiş metin · not & vurgu
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
