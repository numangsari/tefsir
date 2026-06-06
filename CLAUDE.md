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

## Bir Sonraki Oturumda Önce Bunlara Bak
- [x] **`ContactMessage` prod DB push'u** — YAPILDI, canlıda doğrulandı (kullanıcı `tefsir.net/iletisim`'den test mesajı gönderdi, yönetici → İletişim sekmesinde göründü). E-posta tesliminin (`CONTACT_EMAIL`/Resend) gerçekten gmail'e düştüğü ayrıca kontrol edilebilir
- [ ] **Analitik canlı doğrulaması**: deploy sonrası `tefsir.net` ziyaret edilip yönetici → Trafik sekmesinde veri düşüyor mu kontrol et (ilk veriler birkaç dk içinde). Vercel Analytics dashboard'u ayrıca etkinleştirilmeli (Vercel proje → Analytics → Enable)
- [ ] **`prisma db push` shell tuzağı**: db migration'ı her zaman `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` ile çalıştır (shell'deki `file:./dev.db` yoksa Neon yerine SQLite'a gider). Ayrıca güvenlik sınıflandırıcısı production DB push'u engelleyebilir → kullanıcı onayı gerekir
- [ ] **Mobil dokunmatik testi**: deploy sonrası gerçek telefonda `/oku` aç — alt sekme çubuğu (Tefsirler/Metin/Araçlar) geçişleri, Arapça kelimeye dokununca tooltip, "Sıradaki" erişimi, kaydırınca başlığın kompaktlaşması akıcı mı kontrol et
- [ ] Olası sonraki adımlar: içerik sekmesinden modernizasyon tetikleme / kullanıcı detay modalı / CSV dışa aktarma / analitik için bot filtresini güçlendirme / yönetici paneli tablolarının tam mobil tasarımı (şimdilik `overflow-x-auto`)
- [ ] Yeni özellik veya hata bildirimi gelirse buraya ekle

## Son Güncelleme
2026-06-06 (9. iş) — **Ana sayfa güncellemeleri + okuma ilerlemesi**. (1) Hero metni "…anlaşılır biçimde okuyun." olarak güncellendi; (2) hero'da BrandMark sembolünün sağına büyük "tefsir.net" yazısı; (3) TopBar hadis-i şerif fontu büyütüldü (text-xs→text-base serif); (4) TopBar arama ikonu büyütüldü (text-lg→text-2xl, w-9 h-9); (5) **Hesabım → Okuma ilerlemesi** bölümü: `GET /api/my/progress` (raw SQL — sûre bazında okunan TafsirReadMark / o sûredeki toplam TafsirContent; yalnız başlanan sûreler, yüzde desc sıralı), profilde her sûre için yüzde + ilerleme barı + sûreye link. Metrik kararı kullanıcıyla: **tam tefsir kapsamı** (payda=gerçek tefsir içeriği sayısı, ayetCount×11 değil → eksik içerikli ayetlerde %100 ulaşılabilir). Yeni DB kolonu YOK. tsc/build temiz.
Önceki (8. iş, ek) — **İletişim yanıtı site adına gönderiliyor**. Sorun: panel "Yanıtla" sadece `mailto:` linkiydi → cevap admin'in kendi Gmail'inden gidiyordu (ziyaretçi tefsir.net'ten yanıt bekliyor). Çözüm: panelde satır içi yanıt kutusu + `POST /api/admin/contact/reply` → `sendContactReply` (Resend; `from: noreply@tefsir.net`, `to: ziyaretçi`, `replyTo: CONTACT_EMAIL`; gövdede yanıt + alıntılı orijinal mesaj). Gönderince mesaj okundu işaretlenir + audit `contact.reply`. Yeni DB kolonu YOK (mevcut ContactMessage). tsc/build temiz.
Önceki (8. iş) — **Ana sayfa (tanıtım) + İletişim sayfası**. (1) `/` artık landing/tanıtım (eskiden giriş ekranıydı): hero + 4 özellik kartı + footer, misafir/üyeye göre kişiselleşir. (2) Navigasyon ters çevrildi: `/giris`+`/kayit` doğrudan AuthUnified render ediyor (eskiden `/?tab=`'a redirect), TopBar marka→`/`, giriş→`/giris`, +İletişim linki. (3) `/iletisim` sayfası + `ContactForm` (honeypot, üyede ön-dolu). (4) `POST /api/contact` (doğrulama + saatte 5 rateLimit + DB kayıt + Resend bildirim; e-posta `CONTACT_EMAIL`||numangsari@gmail.com'a, replyTo gönderen). (5) `ContactMessage` modeli. (6) Yönetici "İletişim" sekmesi (6. sekme) + `api/admin/contact` (GET/PATCH/DELETE + audit). (7) sitemap+`.env.example`(`CONTACT_EMAIL`). tsc/lint/build temiz. Commit+push edildi (5bd75e8). ContactMessage prod DB'ye push edildi ve canlıda doğrulandı (test mesajı → yönetici İletişim sekmesinde göründü).
Önceki iş (2026-06-06, 7.) — **Mobil uyumluluk**. Önce tüm site analiz edildi; asıl sorun okuyucu (`/oku`) 3 sütunlu grid'in mobilde alt alta dizilmesiydi (11 tefsir kartı metnin üstünde, "Sıradaki" en altta). Uygulananlar: (1) **Okuyucu mobil sekmeli düzen** (`TafsirReader.tsx`) — `mobilePane` state (`list|text|tools`, varsayılan `text`), kök `grid`→`md:grid` (mobilde tek sütun + `pb-20`), üç bölme `hidden/block` + `md:block`, alt sabit **sekme çubuğu** (Tefsirler/Metin/Araçlar, Araçlar'da vurgu+not rozeti), tefsir seçilince otomatik Metin'e geçiş, "Sıradaki" mobilde metin altında (sağ panel kopyası `hidden md:block`), OKU yuvarlağı mobilde `w-9 h-9`; (2) **Arapça tooltip dokunmatik** (`AyahArabicWithTooltip` + `AyahWordBridge`) — `onClick` toggle + dışarı dokununca `pointerdown` ile kapat (hover korunur); (3) **Sticky başlık mobilde kompakt** (`AyahStickyHeader`) — kaydırınca (compact) Arapça+meal bridge mobilde gizlenir (`hidden md:block`); (4) `layout.tsx` **viewport export** (device-width + themeColor `#065f46`); (5) `ScrollToTopButton` mobilde `bottom-20` (sekme çubuğuyla çakışmasın). Masaüstü (≥md) düzeni hiç değişmedi. tsc/lint/build temiz; dev'de `/oku/2/6` SSR markup'ı curl ile doğrulandı (sekme çubuğu, çift Sıradaki, theme-color, pb-20 hepsi render). Diğer sayfalar (profil/panel/arama/sûreler) zaten `flex-wrap`/responsive grid; dokunulmadı. ⚠️ Dev'i `env -u DATABASE_URL -u DIRECT_URL npm run dev` ile çalıştır (shell'de `file:./dev.db` miras alınıp Prisma'yı 500 yapıyor).
Önceki iş (2026-06-06, 6.) — Performans: (1) `vercel.json` → `regions: ["fra1"]` (Neon ile aynı bölge; her DB round-trip ~95ms→~birkaç ms — Vercel'de en yüksek etkili kazanç); (2) okuyucu veri katmanı `src/lib/reader-data.ts` — React `cache` ile generateMetadata/sayfa sûre-ayet sorgu paylaşımı + `Promise.all` + 114 sûre `unstable_cache`; (3) tefsir **SSR seed** — varsayılan tefsir metni sayfayla render edilip `initialTafsir` prop'uyla geçiyor → açılışta metin anında, client fetch şelalesi kalkar; misafirde ilk fetch atlanıyor, girişlide not/vurgular arka planda. Önce ÖLÇÜM yapıldı (`scripts/perf-measure.ts`): asıl darboğaz bölge/round-trip gecikmesiydi, arama indeksi (pg_trgm) değil — yalnız 612 satır sadeleşmiş, tefsir araması zaten 7ms; pg_trgm modernizasyon 68k'ya ölçeklenince gerekecek (ERTELENDİ). tsc/lint/build temiz. ⚠️ Deploy sonrası Vercel dashboard'dan fonksiyon bölgesinin fra1 olduğunu doğrula.
Önceki iş (2026-06-06, 5.) — SEO III: (1) sitelinks arama kutusu — WebSite JSON-LD'ye SearchAction (`/arama?q=`), arama sayfası mount'ta `window.location.search`'ten `?q=` okuyor (deep-link); (2) iç bağlantı — okuyucu altına server-render breadcrumb + önceki/sonraki ayet `<a>` (rel prev/next, sûre sınırını geçer) → Googlebot tüm ayetleri keşfeder; (3) içeriksiz ayet sayfaları `noindex, follow` (generateMetadata'da TafsirContent sayımı). tsc/lint/build temiz, yerelde doğrulandı. ÖNEMLİ ders: turbopack build'de OG/route dosyasında yerel asset'i (font) top-level `fs`/`new URL(import.meta.url)` ile okuma — Vercel'de paket dışı kalıp tüm siteyi 500 yapar; runtime'da CDN'den lazy+try/catch al (commit e917b57).
Önceki iş (2026-06-06, 4.) — SEO II: (1) `next/og` ile OG paylaşım görselleri — kök marka kartı + ayet bazlı dinamik (sûre/ayet/meal); Türkçe için PT Serif TTF gömülü (`_og/brand.ts`, font `readFileSync(fileURLToPath(new URL()))` ile — Node fetch `file:` desteklemiyor); (2) JSON-LD (`JsonLd` bileşeni) — layout WebSite/Organization, okuyucu Article/BreadcrumbList; (3) Google Search Console doğrulama env desteği (`GOOGLE_SITE_VERIFICATION` → metadata.verification.google). tsc/lint/build temiz; OG yerelde render doğrulandı. Kalan: kullanıcı GSC doğrulaması + sitemap gönderimi; `/arama?q=` deep-link (sitelinks arama kutusu) sonraya.
Önceki iş (2026-06-06, 3.) — Logo + marka + SEO başlangıcı: (1) "Sıradaki" butonu sağ panele (sticky flex sütun, alta sabit) alındı, en üste çık butonu sol alta taşındı; (2) `BrandLogo`/`BrandMark` SVG logo + `app/icon.svg` favicon; (3) sekme başlığı `layout.tsx` metadata template'i `%s · tefsir.net`, okuyucuya `generateMetadata` (ör. "Bakara Sûresi 6. ayet · tefsir.net"); (4) SEO: metadataBase/openGraph/robots meta + `robots.ts` + `sitemap.ts` (yalnız içeriği olan ayet sayfaları). tsc/lint/build temiz. NOT: başlık SEO için sayfa-önce sıralı (marka sonda); kullanıcının örneği marka-önceydi.
Önceki iş (2026-06-06, 2.) — Okuyucu akışı II (canlı geri bildirim): (1) "Sıradaki" butonu mevcut tefsiri sessizce okundu yapıyor (`persistReadMark`/`handleSiradaki`); (2) "Burada kaldım" dikey konumu localStorage'a yakalanıp (`tafsir-scroll.ts`) resume linkine `?pos=` ile dönülünce `TafsirContentView.scrollToOffset` ile geri yükleniyor (konum cihaza özel — üretim DB push'undan kaçınıldı); (3) `﴾ 6 ﴿`/`{6}` süslü-Arapça parantezli ayet no temizliği `cleanTafsirText`'e eklendi; (4) sticky başlık yüksekliği `ResizeObserver`→`--ayah-sticky-h` ile ölçülüp yan panellerin top/max-h'ı bağlandı (üstten kesilme düzeldi); (5) sağ panel ipucu "çift tıklayın"; (6) sağ panel vurgu/not listesinden tıklayınca metinde o öğeye kaydırma (`jumpToAnchor`). tsc/lint/build temiz.
Önceki iş (2026-06-06, 1.) — Okuyucu akışı iyileştirmeleri (7 küçük UX): (1) OKU butonu okundu işaretleyince sıradaki tefsire/ayete geçiyor; (2) tefsir metni sonunda "Sıradaki" butonu — ikisi de `OkuReaderShell.handleAdvance` (`onAdvance` prop'u); (3) baş/sondaki ayet numarası ("(6)") temizliği `src/lib/clean-tafsir-text.ts` ile (API + yazdırma sayfasında; vurgu/not offset'leri `trimStart` kadar kaydırılıyor, yeni eklenenler `textTrimStart` ile ham koordinata çevriliyor); (4) `ScrollToTopButton`; (5) not ekleme artık çift tıklama; (6) Arapça tooltip aşağı açılıyor (çakışma giderildi); (7) banner "…hata bulunabilir". tsc/lint/build temiz.
Önceki iş (2026-06-04, 3.) — Soft delete + audit log. `User.deletedAt` + yeni `AuditLog` (Neon'a db push edildi). Kullanıcı silme artık geri alınabilir (soft); `?permanent=1` hard delete; `auth.ts` silinmiş hesabı reddediyor; `restore` ile geri yükleme. Tüm admin işlemleri `lib/audit.ts` → AuditLog'a yazılıyor; yeni "Denetim Kaydı" sekmesi (panel 5 sekme). tsc/lint/build temiz.
Önceki iş (2026-06-04, 2.) — Site trafiği analitiği eklendi. Vercel Web Analytics verisi API ile çekilemiyor (hiçbir planda public endpoint yok) → **kendi çerezsiz analitiğimiz** kuruldu: `PageView` modeli (Neon'a db push edildi), public `/api/track` (visitorKey = günlük tuz+IP+UA hash, ham IP saklanmaz), layout'ta `AnalyticsTracker` (sendBeacon, `/yonetici` hariç), ADMIN `/api/admin/analytics`, yeni **Trafik sekmesi** (panel artık 4 sekme). Ayrıca `@vercel/analytics` + `<Analytics />` eklendi (Vercel dashboard'da görünür, panele bağlanamaz). tsc/lint/build temiz (`next build` sandbox kapalı çalışır).
Önceki iş (2026-06-04, 1.): Yönetici paneli 3 sekmeye dönüştürüldü (Genel Bakış/Kullanıcılar/İçerik), bağımlılıksız SVG grafikler, content API. Commit'lendi (3392b38).
