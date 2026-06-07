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
| `src/app/page.tsx` | **Ana sayfa = tanıtım/landing** (8. iş). Herkese gösterilir; misafir/üyeye göre kişiselleşir. Eskiden giriş/kayıt ekranıydı |
| `src/app/giris/page.tsx` / `src/app/kayit/page.tsx` | AuthUnified'i render eder (defaultTab giris/kayit). Eskiden `/?tab=`'a redirect ediyordu — ters çevrildi (8. iş) |
| `src/app/iletisim/{layout,page}.tsx` + `ContactForm.tsx` | İletişim sayfası: form (honeypot, başarı ekranı, üyede ön-dolu) |
| `src/app/api/contact/route.ts` | POST: doğrulama + rateLimit (saatte 5) + ContactMessage create + Resend bildirim |
| `src/app/api/admin/contact/route.ts` | ADMIN: iletişim mesajları GET/PATCH(okundu)/DELETE; recordAudit |
| `src/app/api/admin/contact/reply/route.ts` | ADMIN: mesaja site adına (noreply@tefsir.net) Resend yanıtı; replyTo=CONTACT_EMAIL; gönderince okundu+audit (contact.reply) |
| `src/app/api/my/progress/route.ts` | Okuma ilerlemesi: sûre bazında okunan tefsir-metni / toplam (raw SQL); sadece başlanan sûreler. Profil "Okuma ilerlemesi" bölümünü besler |
| `src/app/yonetici/IletisimTab.tsx` | Panel "İletişim" sekmesi (6. sekme); okunmamış rozeti, okundu/yanıtla/sil |
| `src/app/oku/[surah]/[ayah]/page.tsx` | Ana okuyucu sayfası |
| `src/components/TafsirReader.tsx` | Tefsir listesi + içerik paneli. Masaüstü 3 sütun grid; mobilde `mobilePane` state ile sekmeli (alt sekme çubuğu: Tefsirler/Metin/Araçlar) |
| `src/components/OkuReaderShell.tsx` | Sticky başlık + okuyucu birleşimi |
| `src/components/AyahWordBridge.tsx` | Arapça–meal çift yönlü kelime vurgusu (tooltip kelimenin altında açılır) |
| `src/components/ScrollToTopButton.tsx` | Sayfa kaydırılınca beliren "en üste çık" yüzen butonu (sol altta; sağdaki Sıradaki ile çakışmasın diye) |
| `src/components/BrandLogo.tsx` | `BrandLogo` (kitap işareti + "tefsir.net" markası) ve `BrandMark` (yalnız işaret) — bağımsız SVG |
| `src/app/icon.svg` | Favicon (Next.js otomatik); açık kitap + emerald zemin |
| `src/app/robots.ts` / `src/app/sitemap.ts` | SEO: robots (yönetim sayfaları kapalı) ve sitemap (sadeleştirilmiş içeriği olan ayet sayfaları, günlük revalidate) |
| `src/app/opengraph-image.tsx` | Marka OG paylaşım görseli (1200×630, `next/og`) |
| `src/app/oku/[surah]/[ayah]/opengraph-image.tsx` | Ayet bazlı dinamik OG görseli (sûre+ayet+meal) |
| `src/app/_og/brand.ts` + `*.ttf` | OG ortak font yükleyici (`ogFonts`, PT Serif gömülü) + marka işareti data-URI |
| `src/components/JsonLd.tsx` | schema.org JSON-LD gömen sunucu bileşeni (layout: WebSite/Organization; okuyucu: Article/Breadcrumb) |
| `src/lib/clean-tafsir-text.ts` | Tefsir metni baş/sonundaki ayet numarası işaretini temizler — `(6)`, `﴾ 6 ﴿`, `{6}` (`cleanTafsirText` → `{ text, trimStart }`); API + yazdırma sayfası kullanır |
| `src/lib/reader-data.ts` | Okuyucu cached veri katmanı: `getSurah`/`getAyah`/`getAyahTafsirs` (React `cache` — istek içi dedupe), `getAllSurahs`/`getModernizedTafsirRaw` (`unstable_cache` — istekler arası, revalidate). Tefsir SSR seed buradan beslenir |
| `vercel.json` | Fonksiyon bölgesi `fra1` (Frankfurt) — Neon eu-central-1 ile aynı yer; DB round-trip gecikmesini düşürür |
| `src/lib/tafsir-scroll.ts` | "Burada kaldım" dikey konum hafızası (localStorage): `captureTafsirScrollOffset`, `resumeScrollKey`, save/get/clear |
| `src/components/AuthUnified.tsx` | Giriş/kayıt birleşik ekranı |
| `src/app/yonetici/page.tsx` | Yönetici paneli — 5 sekmeli kabuk (Genel Bakış / Trafik / Kullanıcılar / İçerik / Denetim) |
| `src/app/yonetici/{ui,types}.tsx/ts` | Panel ortak UI bileşenleri (Tabs, StatCard, ProgressBar, SparkArea — bağımlılıksız SVG) + paylaşılan tipler |
| `src/app/yonetici/{GenelBakis,Trafik,Kullanicilar,Icerik,Denetim}Tab.tsx` | Panel sekmeleri; her biri kendi `/api/admin/*` verisini çeker |
| `src/app/api/admin/{stats,users,content,analytics,audit}/route.ts` | Panel API'leri (ADMIN korumalı); audit = denetim kaydı, analytics = trafik |
| `src/lib/audit.ts` | `recordAudit()` — admin işlemlerini AuditLog'a yazar (hata olsa bile asıl işlemi bozmaz) |
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
- **`prisma db push` shell tuzağı**: migration'ı her zaman `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` ile çalıştır — shell'deki `file:./dev.db` varsa Neon yerine SQLite'a gider. Güvenlik sınıflandırıcısı production push'u engelleyebilir → kullanıcı onayı gerekir.

## Bir Sonraki Oturumda Önce Bunlara Bak
- [x] **Analitik canlı doğrulaması**: ✅ doğrulandı (12. iş)
- [x] **Google Search Console**: ✅ doğrulama + sitemap gönderimi yapıldı (12. iş)
- [ ] **Mobil dokunmatik testi**: gerçek telefonda `/oku` aç — alt sekme çubuğu geçişleri, Arapça kelimeye dokununca tooltip, "Sıradaki" erişimi, başlığın kompaktlaşması akıcı mı kontrol et.
- [ ] **Tefsir modernizasyonu**: `modernize-tafsirs.ts` ile AI sadeleştirmeyi ilerlet (şu an ~612/68k modernize).

## Son Güncelleme
2026-06-07 (12. iş) — Analitik doğrulama + Google Search Console kurulumu tamamlandı.
