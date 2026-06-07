# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

### 2026-06-07 (13. iş) — Kapsamlı denetim bulguları düzeltildi ✅

Tam proje denetimi yapıldı; tespit edilen 6 sorun giderildi.

**Düzeltilen yerler:**
- `next.config.ts`: CSP'ye `va.vercel-scripts.com` (script-src) ve `vitals.vercel-insights.com` (connect-src) eklendi — Vercel Analytics artık çalışıyor
- `emaili-dogrula/page.tsx`: Kırık `/?tab=kayit` linki → `/kayit` düzeltildi; hem "süresi doldu" hem de "e-posta gönderildi" ekranlarına yeniden gönderme formu eklendi
- `api/auth/resend-verification/route.ts`: Yeni endpoint — doğrulama e-postasını yeniden gönderir; eski tokenları temizler; 5/15dk rate limit middleware'de de eklendi
- `middleware.ts`: `resend-verification` matcher ve `AUTH_ROUTES`'a eklendi
- `api/my/progress/route.ts`: İlerleme yüzdesi paydasına `modernizedAt IS NOT NULL` filtresi eklendi — gizli içerik artık sayıya dahil değil
- `TafsirReader.tsx:724`: NoteEditor textarea `bg-white/70` → `bg-white` (şeffaflık giderildi)
- `package.json`: `cheerio` ve `iconv-lite` production'dan devDependencies'e taşındı

**Değiştirilen Dosyalar:**
- `next.config.ts`: CSP script-src + connect-src güncellendi
- `src/app/emaili-dogrula/page.tsx`: Kırık link düzeltildi + ResendForm bileşeni eklendi
- `src/app/api/auth/resend-verification/route.ts`: Yeni (oluşturuldu)
- `src/middleware.ts`: resend-verification rate limit eklendi
- `src/app/api/my/progress/route.ts`: modernizedAt filtresi eklendi
- `src/components/TafsirReader.tsx`: textarea opak yapıldı
- `package.json` + `package-lock.json`: bağımlılıklar yeniden düzenlendi

**Sonraki Adımlar:**
- [ ] Tefsir modernizasyonunu ilerlet (`modernize-tafsirs.ts`, Gemini veya Ollama)

### 2026-06-07 (12. iş) — Analitik doğrulama + Google Search Console kurulumu ✅

- **Yönetici → Trafik sekmesi** canlıda doğrulandı: ziyaret sayacı düşüyor.
- **Google Search Console** doğrulaması yapıldı ve sitemap gönderildi.
- Tefsir modernizasyonu (AI sadeleştirme) ertelendi — daha sonra ele alınacak.

**Sonraki Adımlar:**
- [ ] Tefsir modernizasyonunu ilerlet (`modernize-tafsirs.ts`, Gemini veya Ollama)

### 2026-06-07 (11. iş) — Açılır menü arka plan şeffaflığı + z-index düzeltmesi ✅ canlıda doğrulandı

Kullanıcı: "açılır menülerde arkası görünüyor".

**Sorun 1 — Şeffaf arka planlar:** 10. iş sırasında yapılan glassmorphism tasarım yenilemesinde bazı form elementleri ve açılır menüler yarı saydam arka plan aldı (`bg-white/70`, `bg-white/90`, vb.).

**Düzeltilen yerler (commit 89a66e6):**
- `TopBar.tsx`: Mobil hamburger menüsü `bg-white/90 dark:bg-stone-900/90` + `backdrop-blur-md` → `bg-white dark:bg-stone-900` (tam opak)
- `SurahIndexView.tsx`: Arama input + 2 `<select>` `bg-white/70 dark:bg-stone-900/60` → `bg-white dark:bg-stone-900`
- `PanelView.tsx`: 3 `<select>` filtre `bg-white/70 dark:bg-stone-800/70` → `bg-white dark:bg-stone-800`
- `arama/page.tsx`: 3 input `bg-white/70 dark:bg-stone-900/60` → `bg-white dark:bg-stone-900`

**Sorun 2 — z-index/CSS boyama sırası (AyahStickyHeader):** Ayet seçici dropdown'ı Arapça kelime span'larının (`position: relative`) altında kalıyordu. `surface-glass` araç çubuğu `backdrop-filter` ile stacking context oluşturuyordu ama `position` olmadan `z-index` etkisizdi.

**Düzeltme (commit d528755):** Araç çubuğuna `relative z-10` eklendi — `relative` ile pozisyonlandı, `z-index` geçerli oldu, Arapça span'ların önüne geçti.

**Kullanıcı geri bildirimi:** "görünmüyor sorun çözülmüş" — canlıda tefsir.net'te doğrulandı.

**Sonraki Adımlar:**
- [x] Açılır menü şeffaflık sorunu giderildi
- [x] z-index/boyama sırası sorunu giderildi

### 2026-06-07 (10. iş) — Efektli/modern tasarım yenilemesi (yalnız görsel)

Kullanıcı, paylaştığı koyu zeminli "proje yönetim paneli" görsellerindeki gibi **modern ve efektli** bir tasarım istedi — **içerik/fonksiyon hiç değişmeden**, yalnız görsel. Kararlar (kullanıcıyla): kapsam = tüm site, tema = her ikisi de korunur (koyuda tam efekt, açıkta yumuşatılmış), okuyucu = ölçülü efekt (çevre camlı, metin alanı sade/kontrastlı).

**Yaklaşım — merkezi tasarım katmanı (komponent bazlı değil):**
- `globals.css`: (1) **ambient ışıma arka planı** — `body::before` ile emerald/teal radyal gradyanlar (koyuda güçlü, açıkta düşük opaklık), koyu taban `#0a0a0a`; (2) `@layer components` yeniden kullanılabilir sınıflar: `.surface-glass` (cam yüzey: backdrop-blur + yarı saydam + iç/dış gölge), `.surface-glass-hover` (emerald hover glow), `.btn-glow` (emerald gradyan pill + glow), `.btn-outline-glow` (saydam pill), `.badge-glow`; (3) `animate-fade-up` + reduced-motion. Mevcut `.hl/.note-inline/.arabic/.tefsir-body/toast` **birebir korundu**.
- `tailwind.config.ts`: `fontFamily.serif = [var(--font-serif), ...]` (tüm `font-serif` kullanımları tek hamlede yükseldi), `boxShadow.glow/glow-lg`, `fade-up` keyframe/animation.
- `layout.tsx` + `globals.css`: zarif serif font **Newsreader** — `next/font` yerine mevcut Amiri gibi `<link>` ile runtime'da yüklendi (build-time ağ bağımlılığı yok), `:root --font-serif` ile bağlandı.

**Uygulama (sınıf swap'ı, fonksiyon dokunulmadı):** TopBar (opak yeşil bar → her iki temada okunur cam header), BrandLogo (adaptif metin + glow), page.tsx (hero ambient + serif + glow CTA + cam kartlar + cam iletişim), AuthUnified (cam form + glow butonlar + gradyan sol panel), ContactForm, okuyucu — AyahStickyHeader/TafsirReader (paneller cam, **orta metin paneli yüksek kontrastlı**, "Sıradaki"/NoteEditor glow)/AnnotationTools/BookmarkButton/FontSizeControl/NotesPanel/SearchPalette/ScrollToTopButton, yonetici/ui.tsx (Card/StatCard cam → tüm sekmeler), profil/panel/sureler/arama sayfaları (kartlar cam, inputlar/butonlar modern; kırmızı "Hesabı sil" korundu).

**Doğrulama:** `tsc --noEmit` temiz, `npm run build` temiz. Dev'de (port 3001) `/`, `/oku/2/6`, `/giris`, `/iletisim` 200 + yeni sınıflar render, `tefsir-body` korunmuş, log'da hata yok. Tarayıcıda gözle (özellikle iki tema + mobil) kullanıcı kontrolü kaldı.

### 2026-06-06 (9. iş) — Ana sayfa güncellemeleri + okuma ilerlemesi

Kullanıcı ana sayfa ve birkaç UI iyileştirmesi istedi (ekran görüntüsüyle).

**Uygulananlar:** (1) Hero açıklama metni "…sadeleştirilmiş ve anlaşılır biçimde **okuyun**. Kelime kelime meal…" olarak güncellendi. (2) Hero'da yalnız sembol vardı; sembolün (BrandMark) sağına büyük **"tefsir.net"** kelime markası eklendi (yan yana). (3) `TopBar`'daki hadis-i şerif fontu büyütüldü (`text-xs`→`text-base` + serif). (4) `TopBar` sağ üst arama ikonu büyütüldü (`text-lg`→`text-2xl`, buton `w-8`→`w-9`). (5) **Hesabım → "Okuma ilerlemesi"** bölümü: `GET /api/my/progress` raw SQL ile her sûrede okunan tefsir-metni (TafsirReadMark) / o sûredeki toplam tefsir içeriği (TafsirContent) oranını döner; profilde her başlanan sûre için **yüzde + ilerleme barı** + okunan/toplam + sûreye link. OKU butonuyla işaretlenen tefsirler zaten okundu sayılıyordu; ilerleme bunun üzerine kuruldu.

**Karar (kullanıcıyla):** yüzde = **tam tefsir kapsamı** (payda = o sûredeki gerçek TafsirContent sayısı — ayetCount×11 değil, çünkü her ayette 11 tefsir içeriği olmayabilir; gerçek sayı kullanılınca %100 ulaşılabilir kalır). Liste yalnız başlanan sûreleri gösterir. **Yeni DB kolonu yok**, deploy ile çalışır. tsc/build temiz.

### 2026-06-06 (8. iş, ek) — İletişim yanıtı site adına gönderiliyor

Kullanıcı fark etti: panelden "Yanıtla" deyince cevap kendi şahsi Gmail'inden gidiyor (çünkü buton sadece `mailto:` linkiydi, Mac Mail uygulamasını açıyordu). Beklenen: yanıt tefsir.net adından gitsin.

**Uygulananlar:** (1) `email.ts` → `sendContactReply` + `contactReplyTemplate` (Resend; `from: noreply@tefsir.net`, `to: ziyaretçi`, `replyTo: CONTACT_EMAIL`||numangsari@gmail.com; e-posta gövdesinde admin yanıtı + altında alıntılı orijinal mesaj). (2) `POST /api/admin/contact/reply` (ADMIN; doğrulama, Resend gönderim, başarıda mesajı okundu işaretle + `recordAudit('contact.reply')`). (3) `IletisimTab.tsx`: "Yanıtla" artık satır içi yanıt kutusu açıyor (mailto kaldırıldı); gönderince toast + okundu güncelle. (4) Denetim sekmesine "Mesaj yanıtlandı" etiketi. **Yeni DB kolonu yok** (mevcut ContactMessage), deploy ile doğrudan çalışır. tsc/build temiz.

### 2026-06-06 (8. iş) — Ana sayfa (tanıtım) + İletişim sayfası

Kullanıcı iki yeni sayfa istedi: (1) sitenin genel tanıtımı olan, tefsir okuma/arama/notlar/hesabım'a yönlendiren bir **ana sayfa**; (2) kullanıcıların mesaj gönderebileceği bir **iletişim sayfası**.

**Onaylanan kararlar:** (a) tanıtım herkese gösterilir (giriş yapan da görür); (b) iletişim mesajları hem Resend ile e-posta gelir hem de DB'ye kaydedilip yönetici panelinde okunur.

**Uygulananlar:**
1. **Ana sayfa tanıtıma çevrildi** (`src/app/page.tsx`): eskiden `/` = giriş/kayıt ekranıydı (misafire AuthUnified, üyeyi `/oku`'ya redirect). Artık landing: hero (marka + "11 klasik tefsir ile okuyun" + CTA'lar), 4 özellik kartı (Tefsir Oku/Arama/Notlarım/Hesabım), iletişim çağrısı, footer. Misafir/üyeye göre kişiselleşiyor (misafirde "Ücretsiz üye ol" + kartlarda "Üyelik gerekir" rozeti).
2. **Navigasyon refactor**: `/giris` ve `/kayit` artık doğrudan AuthUnified render ediyor (eskiden `/?tab=`'a redirect; ters çevrildi). TopBar markası `/oku`→`/`, "Giriş yap" `/`→`/giris`, nav'a "İletişim" linki (geniş+mobil) eklendi. Bonus: `/yonetici`'nin zaten yaptığı `/giris?callbackUrl=...` redirect artık doğru çalışıyor.
3. **İletişim sayfası** (`src/app/iletisim/`): `layout.tsx` (TopBar, arama deseni), `page.tsx` (üyede ad/e-posta ön-dolu), `ContactForm.tsx` (client; honeypot spam koruması, başarı ekranı, `useToast`).
4. **`POST /api/contact`**: doğrulama (ad/e-posta/mesaj zorunlu, uzunluk, e-posta regex), honeypot, `rateLimit` (IP başına saatte 5), `ContactMessage` create, `sendContactNotification` (Resend; `to`=`CONTACT_EMAIL`||numangsari@gmail.com, `replyTo`=gönderen; e-posta hata olsa bile DB kaydı korunur).
5. **`ContactMessage` modeli** (`prisma/schema.prisma`): name/email/subject/body/userId(snapshot)/ipHash(tuzlu, ham IP yok)/readAt/createdAt.
6. **Yönetici "İletişim" sekmesi** (panel artık 6 sekme): `IletisimTab.tsx` (okunmamış rozeti, okundu/okunmadı toggle, mailto yanıtla, sil), `api/admin/contact` (GET/PATCH/DELETE, ADMIN korumalı, `recordAudit`'e contact.read/unread/delete eklendi). `email.ts`'e `sendContactNotification` + HTML-escape'li `contactTemplate`.
7. **SEO/env**: `sitemap.ts`'e `/iletisim`; `.env.example`'a `CONTACT_EMAIL` notu.

tsc/lint/build temiz (lint'te yalnız önceden var olan font uyarısı). Commit+push edildi. `ContactMessage` tablosu production Neon'a push edildi (kullanıcı `env -u … npx prisma db push` çalıştırdı) ve **canlıda uçtan uca doğrulandı**: `tefsir.net/iletisim`'den test mesajı gönderildi, yönetici → İletişim sekmesinde üye rozeti + okunmamış durumuyla göründü.

### 2026-06-06 (7. iş) — Mobil uyumluluk

Kullanıcı sitenin mobil için uyumlu hale getirilmesini, önce tam analiz yapılmasını istedi. Tüm sayfalar incelendi; asıl sorun **okuyucu sayfasıydı** (`/oku`): masaüstünde 3 sütunlu grid (tefsir listesi · metin · not/vurgu araçları) mobilde alt alta diziliyor, kullanıcı metne ulaşmak için 11 tefsir kartını kaydırmak zorunda kalıyor, "Sıradaki" butonu sayfanın en altında erişilemez oluyordu. Ayrıca Arapça kelime tooltip'i sadece hover ile açıldığından dokunmatik cihazlarda hiç çalışmıyordu.

**Onaylanan tasarım:** mobil okuyucu = alt sekme çubuğu (Tefsirler · Metin · Araçlar), varsayılan Metin açık. Masaüstü düzeni aynen korundu.

**Uygulananlar:**
1. **Okuyucu mobil sekmeli düzen** (`TafsirReader.tsx`): `mobilePane` state; kök grid mobilde tek sütun (`md:grid`), her bölme `hidden/block` + `md:block`; alta sabit sekme çubuğu (Araçlar'da vurgu+not rozeti); tefsir seçilince otomatik Metin sekmesine geçiş; "Sıradaki" mobilde metin altında (masaüstü kopyası `hidden md:block`); OKU yuvarlağı mobilde büyütüldü.
2. **Arapça tooltip dokunmatik** (`AyahArabicWithTooltip` + `AyahWordBridge`): kelimeye dokununca aç/kapat (toggle), dışarı dokununca kapanır; hover masaüstünde korunuyor.
3. **Sticky başlık mobilde kompakt** (`AyahStickyHeader`): kaydırınca Arapça+meal mobilde gizlenip okuma alanı açılıyor.
4. **viewport export** (`layout.tsx`): device-width + tema rengi `#065f46`.
5. **"En üste çık" butonu** (`ScrollToTopButton`): mobilde sekme çubuğunun üstüne kaldırıldı (çakışma giderildi).

Diğer sayfalar (profil/panel/arama/sûreler/giriş) zaten `flex-wrap`/responsive grid kullandığından dokunulmadı; yönetici tabloları `overflow-x-auto` ile (admin-only) yeterli kabul edildi. tsc/lint/build temiz; dev sunucuda `/oku/2/6` SSR çıktısı curl ile doğrulandı (sekme çubuğu, çift "Sıradaki", theme-color, viewport, pb-20 hepsi render ediliyor). Gerçek dokunmatik akış deploy sonrası telefonda test edilmeli.

⚠️ Not: dev'i `env -u DATABASE_URL -u DIRECT_URL npm run dev` ile çalıştır — shell'deki `file:./dev.db` Prisma'yı 500 yapıyor.

### 2026-06-06 (6. iş) — Performans: bölge + sorgu paralelleştirme + tefsir SSR seed

Kullanıcı sitenin genel hızlanmasını (tefsir açma + arama sonuçları) istedi. Tahmin yerine önce ölçüm yapıldı (`scripts/perf-measure.ts` — sadece okur: row count + EXPLAIN ANALYZE + sorgu timing).

**Ölçüm bulguları:**
- **Asıl darboğaz: ağ gecikmesi / bölge uyumsuzluğu.** Her DB sorgusu DB içinde 7-19 ms'de bitiyor (EXPLAIN), ama toplam round-trip ~480 ms. Sebep: Neon **eu-central-1 (Frankfurt)**, ama `vercel.json` yok → Vercel fonksiyonları varsayılan **iad1 (ABD)** → her sorgu Atlantik ötesi ~95 ms.
- Okuyucu sayfası 5-6 sorguyu **seri** yapıyor; client tarafı tefsir açılışı 2-3 round-trip daha (HTML→hydrate→fetch şelalesi).
- **Arama indeksi (pg_trgm) şu an GEREKSİZ**: TafsirContent 68.552 satır ama sadece **612'si sadeleştirilmiş** (aranan tek küme); tefsir araması `(tafsirId, modernizedAt)` indeksiyle 7 ms. pg_trgm modernizasyon 68k'ya ölçeklenince gerekecek → ertelendi.

**Uygulananlar:**
1. **`vercel.json` → `regions: ["fra1"]`** (Frankfurt, Neon ile aynı bölge). En yüksek etki: her DB round-trip ~95ms → ~birkaç ms. ⚠️ Vercel deploy sonrası fonksiyon bölgesinin gerçekten fra1 olduğu Vercel dashboard'dan doğrulanmalı.
2. **Okuyucu sorgu optimizasyonu** (`src/lib/reader-data.ts`): React `cache` ile sûre/ayet sorguları generateMetadata + sayfa gövdesi arasında paylaşılıyor (tekrar round-trip yok); bağımsız sorgular `Promise.all`; 114 sûre listesi `unstable_cache` (1 gün revalidate, `surahs` tag) ile istekler arası önbellekte.
3. **Tefsir SSR seed**: varsayılan tefsirin (URL `?tafsir=` ya da ilk tefsir) metni sayfayla birlikte sunucuda render edilip `initialTafsir` prop'uyla `TafsirReader`'a geçiyor → açılışta metin **anında** görünür, client fetch şelalesi kalkar. Statik metin `getModernizedTafsirRaw` ile `unstable_cache`'te (`tafsir-content` tag). Misafirde (not/vurgu yok) ilk fetch turu tamamen atlanıyor; girişlide metin görünürken not/vurgular arka planda yükleniyor. Tefsir değişiminde eski metin temizlenip spinner gösteriliyor (bayat içerik yok).

tsc temiz, lint temiz (yalnız önceden var olan font uyarısı), `npm run build` EXIT=0. (Build sırasındaki `prisma:error` satırları shell'deki `file:./dev.db` miras tuzağı — dinamik route'lar prerender edilmediğinden build'i bozmaz; Vercel'de doğru env kullanılır.)

NOT: JWT session kullanıldığı için `auth()` her API çağrısında DB'ye gitmiyor (darboğaz değil). `scripts/perf-measure.ts` yeniden kullanılabilir tanı aracı olarak bırakıldı.

---

### 2026-06-06 (5. iş) — SEO III: sitelinks arama kutusu + iç bağlantı + noindex hijyeni

(Not: 4. iş sonrası OG fontu top-level fs okuması Vercel'de tüm siteyi 500 yapmıştı; commit e917b57 ile font CDN'den lazy fetch'e çevrilip çözüldü.)

- **Sitelinks arama kutusu (SearchAction)**: WebSite JSON-LD'ye `potentialAction` SearchAction (`/arama?q={search_term_string}`) eklendi. Arama sayfası artık mount'ta `window.location.search`'ten `?q=` okuyup aramayı otomatik tetikliyor (deep-link). Böylece Google'da site adı aratınca site içi arama kutusu çıkabilir.
- **İç bağlantı (taranabilir gezinme)**: Okuyucu sayfasının altına server-render `<nav>` — breadcrumb (Sûreler › Sûre › ayet, gerçek `<a>`) + önceki/sonraki ayet linkleri (`rel=prev/next`, sûre sınırında komşu sûreye geçer). Googlebot bu zinciri izleyerek tüm ayet sayfalarını keşfeder. (AyahSelector'ın JS buton gezinmesi tarayıcı için yetersizdi.)
- **İnce sayfa hijyeni**: Sadeleştirilmiş içeriği OLMAYAN ayet sayfaları artık `robots: noindex, follow` (generateMetadata'da içerik sayımı). Google ince sayfaları indekslemiyor ama linkleri takip ediyor; içerik eklenince otomatik indekslenebilir oluyor.
- tsc/lint/build temiz; yerelde doğrulandı (SearchAction, prev/next + sûre sınırı, noindex).

## 🐛 Bilinen Sorunlar
- Modernizasyon `modernize-tafsirs.ts` Ollama ile çalışırken çok kaynak tüketir; `--pauseMs=8000 --ollamaThreads=2` ile hafiflet
- Dev sunucu hata verirse: `rm -rf .next && npm run dev` (eski chunk önbelleği)

## 💡 Kararlar ve Notlar
- Modernizasyon `modernizedAt IS NULL` olanları işler; kesilirse aynı komutla kaldığı yerden devam eder
- `originalText` ham scrape yedeği olarak korunur
- SQLite → Neon PostgreSQL geçişi Vercel'deki kalıcı disk problemi nedeniyle yapıldı
