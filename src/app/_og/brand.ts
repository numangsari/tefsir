// OG (paylaşım) görselleri için ortak font yükleyici + marka işareti.
// `_og` özel klasördür (route değil); birden çok opengraph-image route'u import eder.
//
// ÖNEMLİ: Font yerel dosyadan OKUNMAZ. Build `--turbopack` ile yapıldığında
// `new URL(..., import.meta.url)` + readFileSync kalıbı serverless pakete dahil
// EDİLMİYOR (file tracing başarısız) → Vercel'de modül yüklenirken hata fırlatıp
// onu paylaşan tüm fonksiyonları (sayfaları) çökertiyordu. Bu yüzden font
// çalışma anında CDN'den lazy + hataya dayanıklı biçimde alınır; alınamazsa
// varsayılan fontla devam edilir (route asla patlamaz).

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const FONT_URLS = {
  bold: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptserif/PT_Serif-Web-Bold.ttf",
  regular: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/ptserif/PT_Serif-Web-Regular.ttf",
} as const;

let fontsPromise: Promise<OgFont[]> | null = null;

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error(`font ${r.status}`);
  return r.arrayBuffer();
}

/** PT Serif (Türkçe destekli) fontlarını döndürür; alınamazsa boş dizi (varsayılan font). */
export function ogFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      try {
        const [bold, regular] = await Promise.all([
          fetchFont(FONT_URLS.bold),
          fetchFont(FONT_URLS.regular),
        ]);
        return [
          { name: "PTSerif", data: bold, weight: 700, style: "normal" },
          { name: "PTSerif", data: regular, weight: 400, style: "normal" },
        ];
      } catch {
        return [];
      }
    })();
  }
  return fontsPromise;
}

// Krem daire içinde açık kitap (emerald) — emerald zemin üzerinde kullanılır.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#FEF3C7"/><path d="M16 9.5c-2.3-1.45-5.2-2-8.1-1.5-.6.1-1.02.62-1.02 1.23v10.4c0 .72.64 1.27 1.35 1.15 2.48-.41 4.96.1 6.77 1.37V9.5Z" fill="#065F46"/><path d="M16 9.5c2.3-1.45 5.2-2 8.1-1.5.6.1 1.02.62 1.02 1.23v10.4c0 .72-.64 1.27-1.35 1.15-2.48-.41-4.96.1-6.77 1.37V9.5Z" fill="#065F46"/><path d="M16 9.5v12.85" stroke="#B45309" stroke-width="1.2" stroke-linecap="round"/></svg>`;

export const brandMarkDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(markSvg)}`;

export const OG_SIZE = { width: 1200, height: 630 };
