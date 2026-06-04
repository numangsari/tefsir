# tefsirnet — Claude Teknik Hafızası

## Proje Amacı
Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme sunan Next.js web uygulaması. Hedef kitle: Türkçe konuşan Kur'an okuyucuları.

## Teknoloji Yığını
- **Dil**: TypeScript
- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI**: React 18, Tailwind CSS
- **Auth**: NextAuth v4 (email/şifre + e-posta doğrulama)
- **E-posta**: Resend
- **Veritabanı**: PostgreSQL — Neon (önceden SQLite'tı; `scripts/migrate-to-neon.ts` ile taşındı)
- **ORM**: Prisma 5
- **Deployment**: Vercel

## Mimari Özet
Next.js App Router; API route'ları `src/app/api/` altında. Tefsir verisi PostgreSQL/Neon'da; AI sadeleştirme `scripts/modernize-tafsirs.ts` ile Ollama (lokal, qwen3:8b) veya Gemini üzerinden. Kullanıcı kimlik doğrulama NextAuth; e-posta Resend ile gönderilir.

## Kritik Dosyalar ve Sorumlulukları
| Dosya | Sorumluluk |
|-------|------------|
| `prisma/schema.prisma` | Veri modeli (Surah, Ayah, Tafsir, Note, Highlight, TafsirReadMark…) |
| `src/app/oku/[surah]/[ayah]/page.tsx` | Ana okuyucu sayfası |
| `src/components/TafsirReader.tsx` | Tefsir listesi + içerik paneli |
| `src/components/OkuReaderShell.tsx` | Sticky başlık + okuyucu birleşimi |
| `src/components/AyahWordBridge.tsx` | Arapça–meal çift yönlü kelime vurgusu |
| `src/components/AuthUnified.tsx` | Giriş/kayıt birleşik ekranı |
| `src/app/yonetici/page.tsx` | Yönetici paneli — 4 sekmeli kabuk (Genel Bakış / Trafik / Kullanıcılar / İçerik) |
| `src/app/yonetici/{ui,types}.tsx/ts` | Panel ortak UI bileşenleri (Tabs, StatCard, ProgressBar, SparkArea — bağımlılıksız SVG) + paylaşılan tipler |
| `src/app/yonetici/{GenelBakis,Trafik,Kullanicilar,Icerik}Tab.tsx` | Panel sekmeleri; her biri kendi `/api/admin/*` verisini çeker |
| `src/app/api/admin/{stats,users,content,analytics}/route.ts` | Panel API'leri (ADMIN korumalı); analytics = site trafiği (PageView raw SQL) |
| `src/app/api/track/route.ts` | Public ziyaret kaydı (çerezsiz visitorKey hash); `AnalyticsTracker.tsx` layout'tan sendBeacon ile çağırır |
| `src/app/api/search/route.ts` | Tam metin arama (sure + meal + tefsir + not) |
| `src/app/yazdir/[surah]/[ayah]/[tafsirId]/page.tsx` | Yazdırma sayfası |
| `src/lib/preferred-tafsir.ts` | sessionStorage ile seçili tefsir kalıcılığı |
| `src/data/tafsirs.ts` | 11 tefsir kataloğu (T001–T011) |
| `scripts/modernize-tafsirs.ts` | AI sadeleştirme (Gemini/Ollama) |
| `scripts/migrate-to-neon.ts` | SQLite → Neon PostgreSQL taşıma scripti |
| `scripts/check-user.ts` | Ada/e-postaya göre kullanıcı arar (emailVerified, role…) |
| `scripts/verify-user.ts` | Verilen e-postayı manuel doğrulanmış işaretler |

## Ortam ve Kurulum
```bash
npm install
npm run dev          # Turbopack dev server
npm run build        # prisma generate + next build
npx prisma db push   # Şema değişikliğini DB'ye uygula
npx prisma studio    # DB görsel arayüzü
```

`.env` gerekli değişkenler (`.env.example`'a bak):
`DATABASE_URL`, `DIRECT_URL` (Neon), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`

## GitHub Repo Bilgisi
- **Repo URL**: https://github.com/numangsari/tefsir
- **Ana Branch**: main
- **Branch Stratejisi**: Doğrudan main'e commit (tek geliştirici)

## Önemli Kararlar ve Gerekçeleri
- **SQLite → Neon PostgreSQL**: Vercel'de SQLite'ın kalıcı disk problemi; Neon serverless Postgres daha güvenilir
- **Elmalılı (T012/T013) kaldırıldı**: Sadece 11 tefsir (T001–T011); Elmalılı meal (`tr.yazir`) da kaldırıldı
- **Turbopack**: Next.js 15 build hızı için `--turbopack` açık
- **Misafir okuma modu**: Üye olmadan okuma; not/vurgu için üye olma yönlendirmesi gösterilir
- **Resend e-posta**: Transactional mail için; API key `.env`'de `RESEND_API_KEY`

## Bilinen Kısıtlamalar ve Dikkat Edilecekler
- `modernize-tafsirs.ts` Ollama ile çalışırken çok kaynak tüketir; `--pauseMs` ve `--ollamaThreads` flag'leri ile kısıtla
- Dev sunucu hata verirse: `rm -rf .next && npm run dev`
- Prisma generate Vercel build'den önce koşmalı (`"build": "prisma generate && next build"`)
- **Shell'de eski SQLite `DATABASE_URL=file:./dev.db` export'u miras alınabiliyor** (parent süreçten geliyor; profil dosyalarında değil) → **çözüldü**: DB script'leri `import "./load-env"` (override'lı dotenv) kullanıyor, `.env`'deki Neon URL shell değerini eziyor; artık `env -u …` gerekmeden `npx tsx scripts/*.ts` doğrudan çalışıyor. Yeni DB script'i yazarken ilk satır `import "./load-env";` olmalı
- **Giriş yapılamıyor şikâyeti** → ilk bakılacak: kullanıcının `emailVerified` durumu. `scripts/check-user.ts <ad/email>` ile kontrol; `auth.ts` doğrulanmamışta `EMAIL_NOT_VERIFIED` fırlatıyor

## Bir Sonraki Oturumda Önce Bunlara Bak
- [ ] **Analitik canlı doğrulaması**: deploy sonrası `tefsir.net` ziyaret edilip yönetici → Trafik sekmesinde veri düşüyor mu kontrol et (ilk veriler birkaç dk içinde). Vercel Analytics dashboard'u ayrıca etkinleştirilmeli (Vercel proje → Analytics → Enable)
- [ ] **`prisma db push` shell tuzağı**: db migration'ı her zaman `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` ile çalıştır (shell'deki `file:./dev.db` yoksa Neon yerine SQLite'a gider). Ayrıca güvenlik sınıflandırıcısı production DB push'u engelleyebilir → kullanıcı onayı gerekir
- [ ] Olası sonraki adımlar: içerik sekmesinden modernizasyon tetikleme / kullanıcı detay modalı / CSV dışa aktarma / analitik için bot filtresini güçlendirme
- [ ] Yeni özellik veya hata bildirimi gelirse buraya ekle

## Son Güncelleme
2026-06-04 (2. iş) — Site trafiği analitiği eklendi. Vercel Web Analytics verisi API ile çekilemiyor (hiçbir planda public endpoint yok) → **kendi çerezsiz analitiğimiz** kuruldu: `PageView` modeli (Neon'a db push edildi), public `/api/track` (visitorKey = günlük tuz+IP+UA hash, ham IP saklanmaz), layout'ta `AnalyticsTracker` (sendBeacon, `/yonetici` hariç), ADMIN `/api/admin/analytics`, yeni **Trafik sekmesi** (panel artık 4 sekme). Ayrıca `@vercel/analytics` + `<Analytics />` eklendi (Vercel dashboard'da görünür, panele bağlanamaz). tsc/lint/build temiz (`next build` sandbox kapalı çalışır).
Önceki iş (2026-06-04, 1.): Yönetici paneli 3 sekmeye dönüştürüldü (Genel Bakış/Kullanıcılar/İçerik), bağımlılıksız SVG grafikler, content API. Commit'lendi (3392b38).
