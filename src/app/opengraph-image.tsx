import { ImageResponse } from "next/og";
import { brandMarkDataUri, ogFonts, OG_SIZE } from "./_og/brand";

export const runtime = "nodejs";
export const alt = "tefsir.net — Kur'an-ı Kerim tefsir okuyucu";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          fontFamily: "PTSerif",
          color: "white",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandMarkDataUri} width={148} height={148} alt="" style={{ marginBottom: 30 }} />
        <div style={{ display: "flex", fontSize: 100, fontWeight: 700, letterSpacing: -2 }}>
          <span>tefsir</span>
          <span style={{ color: "#FCD34D" }}>.net</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            marginTop: 20,
            color: "#A7F3D0",
            fontWeight: 400,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          Kur&apos;an-ı Kerim&apos;i 11 klasik Türkçe tefsirle, sade bir dille okuyun
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() }
  );
}
