// Klasik Türkçe tefsir metinlerini AI ile günümüz Türkçesine çevirir.
// ÖNEMLİ: özetleme YOK, kısaltma YOK — sadece dili güncelle.
// Mevcut metin originalText'te yedek; bu script html/text'i günceller, modernizedAt set eder.
//
// Kullanım:
//   npm run modernize -- --surah=2 --provider=ollama --model=qwen3:8b
//   npm run modernize -- --surah=2 --provider=ollama --pauseMs=5000 --ollamaThreads=3
//   GEMINI_API_KEY=... npm run modernize -- --surah=1 --provider=gemini
//
// Ollama varsayılanları bilgisayarı yormamak için düşük tutulur:
//   pauseMs=4000, batchSize=15, batchPauseMs=90000, ollamaThreads=3, numCtx=8192
//
// Her API çağrısı bağımsızdır (yeni oturum); önceki ayetlerin bağlamı taşınmaz.
// Uzun metinler parçalara bölünür; her parça da ayrı çağrıdır.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pLimit from "p-limit";

const prisma = new PrismaClient();

type Provider = "gemini" | "ollama";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OLLAMA_MODEL = "qwen3:8b";
const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_PAUSE_MS = 4000;
const DEFAULT_OLLAMA_BATCH_SIZE = 15;
const DEFAULT_OLLAMA_BATCH_PAUSE_MS = 90_000;
const DEFAULT_OLLAMA_CHUNK_PAUSE_MS = 2000;
const DEFAULT_OLLAMA_THREADS = 3;
const DEFAULT_OLLAMA_NUM_CTX = 8192;
const SYSTEM_INSTRUCTION =
  "Cevap olarak yalnızca dönüştürülmüş metni döndür. Giriş cümlesi, açıklama, önsöz veya 'Elbette, işte güncellenmiş hali:' gibi ifadeler ekleme.";

type ThrottleConfig = {
  pauseMs: number;
  batchSize: number;
  batchPauseMs: number;
  chunkPauseMs: number;
  ollamaThreads: number;
  numCtx: number;
};

function parseArgs() {
  const out: {
    surah?: number;
    from?: number;
    to?: number;
    tafsir?: string;
    model?: string;
    provider?: Provider;
    ollamaHost?: string;
    concurrency?: number;
    pauseMs?: number;
    batchSize?: number;
    batchPauseMs?: number;
    chunkPauseMs?: number;
    ollamaThreads?: number;
    numCtx?: number;
    redo?: boolean;
    limit?: number;
  } = {};
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.replace(/^--/, "").split("=");
    if (k === "surah") out.surah = parseInt(v);
    else if (k === "from") out.from = parseInt(v);
    else if (k === "to") out.to = parseInt(v);
    else if (k === "tafsir") out.tafsir = v;
    else if (k === "model") out.model = v;
    else if (k === "provider" && (v === "gemini" || v === "ollama")) out.provider = v;
    else if (k === "ollamaHost") out.ollamaHost = v;
    else if (k === "concurrency") out.concurrency = parseInt(v);
    else if (k === "pauseMs") out.pauseMs = parseInt(v);
    else if (k === "batchSize") out.batchSize = parseInt(v);
    else if (k === "batchPauseMs") out.batchPauseMs = parseInt(v);
    else if (k === "chunkPauseMs") out.chunkPauseMs = parseInt(v);
    else if (k === "ollamaThreads") out.ollamaThreads = parseInt(v);
    else if (k === "numCtx") out.numCtx = parseInt(v);
    else if (k === "redo") out.redo = true;
    else if (k === "limit") out.limit = parseInt(v);
  }
  return out;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIntEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

function resolveThrottle(provider: Provider, args: ReturnType<typeof parseArgs>): ThrottleConfig {
  const isOllama = provider === "ollama";
  return {
    pauseMs: args.pauseMs ?? parseIntEnv("MODERNIZE_PAUSE_MS") ?? (isOllama ? DEFAULT_OLLAMA_PAUSE_MS : 0),
    batchSize:
      args.batchSize ?? parseIntEnv("MODERNIZE_BATCH_SIZE") ?? (isOllama ? DEFAULT_OLLAMA_BATCH_SIZE : 0),
    batchPauseMs:
      args.batchPauseMs ??
      parseIntEnv("MODERNIZE_BATCH_PAUSE_MS") ??
      (isOllama ? DEFAULT_OLLAMA_BATCH_PAUSE_MS : 0),
    chunkPauseMs:
      args.chunkPauseMs ??
      parseIntEnv("MODERNIZE_CHUNK_PAUSE_MS") ??
      (isOllama ? DEFAULT_OLLAMA_CHUNK_PAUSE_MS : 0),
    ollamaThreads:
      args.ollamaThreads ?? parseIntEnv("OLLAMA_NUM_THREAD") ?? DEFAULT_OLLAMA_THREADS,
    numCtx: args.numCtx ?? parseIntEnv("OLLAMA_NUM_CTX") ?? DEFAULT_OLLAMA_NUM_CTX,
  };
}

type Job = {
  id: number;
  surahId: number;
  number: number;
  tafsirCode: string;
  text: string;
};

function buildPrompt(text: string) {
  return `Şu metni günümüz türkçesine göre yaz ama özüne asla dokunma:\n\n${text}`;
}

async function callGeminiAPI(apiKey: string, model: string, text: string): Promise<string> {
  const prompt = buildPrompt(text);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_INSTRUCTION,
              },
            ],
          },
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        // 503 ve 429 gibi geçici hatalarda fırlatıp yeniden deneme bloğuna girmesini sağlayalım.
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        error?: { message?: string };
      };

      if (data.error) {
        throw new Error(`API hatası: ${data.error.message}`);
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Boş cevap");
      }

      return content.trim();
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      const delay = attempts * 2000;
      console.log(`\n[API Uyarısı] Hata oluştu. ${delay}ms sonra tekrar deneniyor (${attempts}/${maxAttempts})... Hata: ${error instanceof Error ? error.message : error}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Bilinmeyen hata");
}

async function callOllamaAPI(
  model: string,
  ollamaHost: string,
  text: string,
  throttle: Pick<ThrottleConfig, "ollamaThreads" | "numCtx">
): Promise<string> {
  const prompt = buildPrompt(text);
  const url = `${ollamaHost.replace(/\/$/, "")}/api/generate`;
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          system: SYSTEM_INSTRUCTION,
          stream: false,
          options: {
            temperature: 0.3,
            num_thread: throttle.ollamaThreads,
            num_ctx: throttle.numCtx,
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data = (await res.json()) as { response?: string; error?: string };
      if (data.error) throw new Error(`Ollama hatası: ${data.error}`);
      const content = data.response?.trim();
      if (!content) throw new Error("Boş cevap");
      return content;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      const delay = attempts * 2000;
      console.log(
        `\n[API Uyarısı] Hata oluştu. ${delay}ms sonra tekrar deneniyor (${attempts}/${maxAttempts})... Hata: ${
          error instanceof Error ? error.message : error
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Bilinmeyen hata");
}

async function callLLMAPIWithChunking(
  provider: Provider,
  config: { apiKey?: string; model: string; ollamaHost: string; throttle: ThrottleConfig },
  text: string
): Promise<string> {
  // Eşik değeri: 15,000 karakterden uzunsa parçalayarak gönderelim.
  const CHUNK_THRESHOLD = 15000;
  if (text.length <= CHUNK_THRESHOLD) {
    if (provider === "gemini") return callGeminiAPI(config.apiKey!, config.model, text);
    return callOllamaAPI(config.model, config.ollamaHost, text, config.throttle);
  }

  console.log(`\n[Büyük Metin] Metin boyutu büyük (${text.length} karakter). Parçalara bölünüyor...`);
  const paragraphs = text.split(/\n\s*\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + "\n\n" + paragraph).length > 8000) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + paragraph : paragraph;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  console.log(`Metin ${chunks.length} parçaya bölündü. Sırayla işleniyor...`);
  const modernizedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Parça ${i + 1}/${chunks.length} işleniyor (${chunk.length} karakter)...`);
    const modernizedChunk =
      provider === "gemini"
        ? await callGeminiAPI(config.apiKey!, config.model, chunk)
        : await callOllamaAPI(config.model, config.ollamaHost, chunk, config.throttle);
    modernizedChunks.push(modernizedChunk);
    if (provider === "ollama" && config.throttle.chunkPauseMs > 0 && i < chunks.length - 1) {
      await sleep(config.throttle.chunkPauseMs);
    }
  }

  return modernizedChunks.join("\n\n");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function textToHtml(text: string) {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

async function main() {
  const args = parseArgs();
  const provider =
    args.provider ??
    (process.env.MODERNIZE_PROVIDER === "gemini" || process.env.MODERNIZE_PROVIDER === "ollama"
      ? process.env.MODERNIZE_PROVIDER
      : undefined) ??
    (process.env.GEMINI_API_KEY ? "gemini" : "ollama");
  const apiKey = process.env.GEMINI_API_KEY;
  if (provider === "gemini" && !apiKey) {
    console.error(
      "HATA: GEMINI_API_KEY env değişkeni yok.\n" +
        "Google AI Studio'dan bir anahtar oluşturup şöyle ekleyin:\n" +
        '  echo "GEMINI_API_KEY=AIzaSy..." >> .env\n' +
        "veya komutu şu şekilde çalıştırın:\n" +
        '  GEMINI_API_KEY=AIzaSy... npm run modernize -- --surah=1'
    );
    process.exit(1);
  }

  const model =
    args.model ?? (provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OLLAMA_MODEL);
  const ollamaHost = args.ollamaHost ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
  const throttle = resolveThrottle(provider, args);
  const concurrency = args.concurrency ?? (provider === "ollama" ? 1 : 4);
  if (provider === "ollama") {
    // Macbook gibi yerel cihazlarda swap ve yavaşlamayı azaltmak için varsayılanı 1 tutuyoruz.
    console.log(`Provider:    ollama (${ollamaHost})`);
    console.log(
      `Throttle:    pause ${throttle.pauseMs}ms · batch ${throttle.batchSize}/${throttle.batchPauseMs}ms · chunk ${throttle.chunkPauseMs}ms · threads ${throttle.ollamaThreads} · ctx ${throttle.numCtx}`
    );
  } else {
    console.log("Provider:    gemini");
  }
  console.log(`Model:       ${model}`);
  console.log(`Concurrency: ${concurrency}`);

  // Hangi içerikleri işleyeceğiz?
  const whereTafsir = args.tafsir ? { code: args.tafsir } : undefined;
  const tafsirs = await prisma.tafsir.findMany({ where: whereTafsir });
  const tafsirById = new Map(tafsirs.map((t) => [t.id, t]));

  let ayahWhere: { surahId?: number; number?: { gte?: number; lte?: number } } = {};
  if (args.surah) ayahWhere.surahId = args.surah;
  if (args.from || args.to)
    ayahWhere.number = { gte: args.from ?? 1, lte: args.to ?? 1000 };

  const contents = await prisma.tafsirContent.findMany({
    where: {
      tafsirId: { in: tafsirs.map((t) => t.id) },
      ayah: ayahWhere,
      ...(args.redo ? {} : { modernizedAt: null }),
    },
    include: { ayah: { select: { surahId: true, number: true } } },
    take: args.limit ?? undefined,
  });

  console.log(`İşlenecek içerik: ${contents.length}`);
  if (contents.length === 0) {
    console.log("İşlenecek yeni içerik yok. (--redo bayrağı ile tekrar işleyebilirsiniz.)");
    return;
  }

  const jobs: Job[] = contents.map((c) => ({
    id: c.id,
    surahId: c.ayah.surahId,
    number: c.ayah.number,
    tafsirCode: tafsirById.get(c.tafsirId)!.code,
    text: c.originalText || c.text,
  }));

  const limit = pLimit(concurrency);
  let done = 0;
  let failed = 0;
  const startedAt = Date.now();

  async function processJob(j: Job) {
    try {
      const modernized = await callLLMAPIWithChunking(
        provider,
        { apiKey, model, ollamaHost, throttle },
        j.text
      );

      // Sağlık kontrolü: çıktı orijinalin %40'ından kısa ise şüpheli (özetleme)
      const ratio = modernized.length / Math.max(j.text.length, 1);
      if (ratio < 0.4) {
        throw new Error(
          `Çıktı çok kısa (${modernized.length}/${j.text.length} = ${ratio.toFixed(2)}) — özetleme riski`
        );
      }
      if (modernized.length < 20 && j.text.length >= 20) {
        throw new Error(`Çıktı çok kısa: "${modernized.slice(0, 50)}"`);
      }

      await prisma.tafsirContent.update({
        where: { id: j.id },
        data: {
          text: modernized,
          html: textToHtml(modernized),
          charCount: modernized.length,
          modernizedAt: new Date(),
          modernizedBy: `${provider}:${model}`,
        },
      });
      done++;
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = done / elapsed;
      const eta = ((contents.length - done) / Math.max(rate, 0.01) / 60).toFixed(1);
      process.stdout.write(
        `\r${j.tafsirCode} ${j.surahId}/${j.number} · ${done}/${contents.length} · ${rate.toFixed(1)}/s · ETA ${eta}dk · hata ${failed}    `
      );

      if (provider === "ollama") {
        if (throttle.pauseMs > 0) await sleep(throttle.pauseMs);
        if (
          throttle.batchSize > 0 &&
          throttle.batchPauseMs > 0 &&
          done % throttle.batchSize === 0 &&
          done < contents.length
        ) {
          console.log(
            `\n[Dinlenme] ${done} kayıt tamamlandı, ${Math.round(throttle.batchPauseMs / 1000)} sn bekleniyor...`
          );
          await sleep(throttle.batchPauseMs);
        }
      }
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      process.stdout.write(`\n✗ ${j.tafsirCode} ${j.surahId}/${j.number}: ${msg}\n`);
      if (provider === "ollama" && throttle.pauseMs > 0) await sleep(throttle.pauseMs);
    }
  }

  if (concurrency <= 1) {
    for (const j of jobs) await processJob(j);
  } else {
    await Promise.all(jobs.map((j) => limit(() => processJob(j))));
  }

  console.log(
    `\n\nBitti.\n  Başarılı: ${done}\n  Hata: ${failed}\n  Süre: ${((Date.now() - startedAt) / 60000).toFixed(1)} dk`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
