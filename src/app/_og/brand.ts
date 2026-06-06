// OG (paylaşım) görselleri için ortak font yükleyici + marka işareti.
// `_og` özel klasördür (route değil); birden çok opengraph-image route'u buradan
// import eder. import.meta.url bu dosyaya göre çözüldüğünden font yolları sabit.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Node fetch `file:` protokolünü desteklemediğinden fontu fs ile okuyoruz.
// `new URL(<literal>, import.meta.url)` kalıbı Next'in dosyayı sunucu
// paketine dahil etmesini (file tracing) sağlar.
function readFont(rel: string): ArrayBuffer {
  const buf = readFileSync(fileURLToPath(new URL(rel, import.meta.url)));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

const boldFont = readFont("./PTSerif-Bold.ttf");
const regularFont = readFont("./PTSerif-Regular.ttf");

export function ogFonts() {
  return [
    { name: "PTSerif", data: boldFont, weight: 700 as const, style: "normal" as const },
    { name: "PTSerif", data: regularFont, weight: 400 as const, style: "normal" as const },
  ];
}

// Krem daire içinde açık kitap (emerald) — emerald zemin üzerinde kullanılır.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#FEF3C7"/><path d="M16 9.5c-2.3-1.45-5.2-2-8.1-1.5-.6.1-1.02.62-1.02 1.23v10.4c0 .72.64 1.27 1.35 1.15 2.48-.41 4.96.1 6.77 1.37V9.5Z" fill="#065F46"/><path d="M16 9.5c2.3-1.45 5.2-2 8.1-1.5.6.1 1.02.62 1.02 1.23v10.4c0 .72-.64 1.27-1.35 1.15-2.48-.41-4.96.1-6.77 1.37V9.5Z" fill="#065F46"/><path d="M16 9.5v12.85" stroke="#B45309" stroke-width="1.2" stroke-linecap="round"/></svg>`;

export const brandMarkDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(markSvg)}`;

export const OG_SIZE = { width: 1200, height: 630 };
