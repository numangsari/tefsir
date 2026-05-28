// Tefsirsitesi.com HTML temizleme yardımcıları
import * as cheerio from "cheerio";
import iconv from "iconv-lite";

export function pad3(n: number) {
  return String(n).padStart(3, "0");
}

export function tafsirUrl(tafsirCode: string, surahId: number, ayahNo: number) {
  return `http://www.tefsirsitesi.com/Veri/Tefsir/${tafsirCode}/Turkce/${pad3(
    surahId
  )}/${pad3(ayahNo)}.htm`;
}

export async function fetchAndDecode(url: string, charset = "windows-1254"): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 TefsirProjesi/0.1",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return iconv.decode(buf, charset);
}

// Sitedeki tefsir sayfasını temizleyip metni ve html'i döndürür.
// Sayfa düzeni: sayfanın üst kısmında başlık ve renk tag'ı, sonra
// asıl içerik tek bir <font color="#CAD9963"> içinde gelir (boş başlık ve
// CSS sınıfları temizlenir).
export function extractTafsirBody(rawHtml: string): { html: string; text: string } {
  const $ = cheerio.load(rawHtml);
  $("script, style, meta, link, head, title").remove();

  const paragraphs: string[] = [];
  const ps = $("body p");
  if (ps.length > 0) {
    ps.each((_, el) => {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t) paragraphs.push(t);
    });
  } else {
    const text = $("body").text().replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  }

  // İlk 1-2 paragraf çoğunlukla "001 / 001 - Fâtiha Sûresi - (Beydâvi Tefsîri - Türkçe) - CAD9963" gibi başlık satırıdır.
  // Bunu metin gövdesinde tutmaya gerek yok. Tespit: "Sûresi - (" içerir ve "CAD9963" ile biter.
  const cleaned = paragraphs.filter((p) => {
    if (/Sûresi.*-.*\(.*Türkçe\)/.test(p) && p.length < 200) return false;
    if (/^\s*CAD\d+\s*$/.test(p)) return false;
    return true;
  });

  const text = cleaned.join("\n\n").trim();
  const html = cleaned.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  return { html, text };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
