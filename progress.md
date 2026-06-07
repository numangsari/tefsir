# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

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

---

### 2026-06-06 (4. iş) — SEO II: OG görselleri, JSON-LD, Search Console

Görünürlük çalışmasının ikinci dalgası:

- **OG (paylaşım) görselleri**: `next/og` ile dinamik 1200×630 PNG. Kök `opengraph-image.tsx` (marka kartı) + ayet bazlı `oku/[surah]/[ayah]/opengraph-image.tsx` ("Bakara Sûresi 6. ayet" + meal alıntısı). Türkçe karakterler için PT Serif TTF gömüldü (`src/app/_og/`); Node `fetch` `file:`'i desteklemediğinden font `readFileSync(fileURLToPath(new URL(...)))` ile okunuyor (build + Vercel file-tracing uyumlu). Yerelde render doğrulandı.
- **JSON-LD yapısal veri**: `JsonLd` bileşeni. Layout'ta WebSite + Organization; okuyucu sayfasında Article + BreadcrumbList (sûre/ayet kırılımı). Zengin sonuç/kırıntı için.
- **Google Search Console**: `layout.tsx` metadata'sına `verification.google` (env: `GOOGLE_SITE_VERIFICATION`); `.env.example`'a eklendi. Kullanıcı GSC'den HTML-etiketi kodunu alıp Vercel env'e koyacak, sonra sitemap'i gönderecek.
- tsc/lint/build temiz; kök OG statik (○), ayet OG dinamik (ƒ) üretildi.

**Sonraki olası SEO adımları**: Search Console doğrulama + sitemap gönderimi (kullanıcı), sitelinks arama kutusu için `/arama?q=` deep-link desteği, sayfa içi iç bağlantı zenginleştirme.

---

### 2026-06-06 (3. iş) — Logo, marka kimliği ve SEO başlangıcı + Sıradaki konumu

İlk "internette görünür olma" adımları ve okuyucu yerleşim düzeltmesi:

- **"Sıradaki" butonu sağ panele alındı**: Artık tefsirin en altına inmeden de görünüyor — sağ panel sticky bir flex sütun; vurgu/not listesi içte kayıyor, "Sıradaki tefsir/ayet" butonu panelin altına sabit. Çakışmasın diye **"en üste çık" butonu sol alta** taşındı.
- **Logo**: `BrandLogo`/`BrandMark` (bağımsız SVG — açık kitap işareti + "tefsir.net" kelime markası); üst çubukta düz metin yerine kullanılıyor. Favicon: `src/app/icon.svg` (Next otomatik favicon).
- **Sekme başlığı + per-sayfa başlık**: `layout.tsx` metadata yenilendi — `title` artık `{ default, template: "%s · tefsir.net" }`. Okuyucu sayfasına `generateMetadata` eklendi → ör. "Bakara Sûresi 6. ayet · tefsir.net" + meal'den açıklama. Sûreler sayfasına da başlık.
- **SEO altyapısı**: `metadataBase`, description, keywords, openGraph, twitter, robots meta; `src/app/robots.ts` (yönetici/panel/api/yazdir kapalı) ve `src/app/sitemap.ts` (yalnızca sadeleştirilmiş içeriği olan ayet sayfaları + ana sayfalar; günlük revalidate).
- tsc/lint/build temiz; `/icon.svg`, `/robots.txt`, `/sitemap.xml` route'ları üretildi.

---

### 2026-06-06 (2. iş) — Okuyucu akışı iyileştirmeleri II (canlı geri bildirim)

Deploy sonrası canlı kullanımda çıkan 6 düzeltme/istek:

- **"Sıradaki" butonu okundu yapıyor**: Sıradakine geçerken mevcut tefsir (girişliyse) sessizce okundu işaretleniyor (`persistReadMark` + `handleSiradaki`; OKU butonu da aynı yardımcıyı kullanıyor).
- **"Burada kaldım" konum hafızası**: Bookmark kaydedilirken okunan dikey konum (karakter offset'i) yakalanıp **localStorage**'a yazılıyor (`src/lib/tafsir-scroll.ts`); `ResumeButton` linke `?pos=` ekliyor; geri dönünce tefsir o konuma kaydırılıyor (`TafsirContentView.scrollToOffset`, bir kez, sonra `pos` URL'den temizleniyor). Not: konum cihaza özel (sunucuda bookmark dururken tam kaydırma localStorage'da; başka cihazda baştan açılır) — üretim DB'sine şema push'undan kaçınmak için bilinçli tercih.
- **Süslü/Arapça parantezli ayet no temizliği**: `﴾ 6 ﴿`, `{6}` gibi işaretler de `cleanTafsirText`'e eklendi (işaretliyse her zaman, çıplak sayıysa yalnız ayet no'suna eşitse atılır).
- **Sağ panelin üstten kesilmesi düzeltildi**: Sticky başlık yüksekliği `ResizeObserver` ile ölçülüp `--ayah-sticky-h` CSS değişkenine yazılıyor; yan paneller (vurgu/not + tefsir listesi) sticky `top`/`max-height` değerlerini buna bağladı.
- **"çift tıklayın" metni**: Sağ paneldeki ipucu güncellendi (not ekleme zaten çift tıklamaya geçmişti).
- **Vurgu/nota listeden tıklayınca git**: "Bu tefsirdeki vurgularım/notlarım" listesinde bir öğeye tıklayınca metinde o vurguya/nota kaydırılıp kısa vurgu efekti gösteriliyor (`jumpToAnchor` → `onHighlightJump`/`onNoteJump`).
- tsc/lint temiz, `next build` compiled successfully.

---

### 2026-06-06 — Okuyucu akışı iyileştirmeleri (gezinme, temizlik, UX)

Okuma deneyimine yönelik 7 küçük iyileştirme yapıldı:

- **OKU butonu ile ilerleme**: Bir tefsiri "okundu" işaretleyince otomatik olarak sıradaki tefsire; o son tefsirse sıradaki ayete (gerekirse sonraki sûreye) geçilir. Gezinme mantığı `OkuReaderShell.handleAdvance` içinde; `TafsirReader`'a `onAdvance` prop'u olarak iletildi.
- **"Sıradaki" butonu**: Tefsir metninin en altına eklendi (metnin sonuna inince görünür); OKU butonuyla aynı ilerlemeyi yapar (son tefsirse "Sıradaki ayet", değilse "Sıradaki tefsir").
- **Metin temizliği**: Bazı tefsirlerin baş/sonundaki ayet numarası işareti ("(6)" gibi) kaldırıldı. Tek kaynak `src/lib/clean-tafsir-text.ts` (`cleanTafsirText` → `{ text, trimStart }`); sadece parantezli sayı veya tam ayet numarasına eşit çıplak sayı atılır. Hem `/api/tafsir/.../route.ts` hem yazdırma sayfasında uygulanır; vurgu/notlar `trimStart` kadar sola kaydırılır, yeni eklenenler `textTrimStart` ile ham koordinata geri çevrilir (DB ham metne göre tutarlı kalır).
- **"En üste çık" butonu**: `ScrollToTopButton` — sayfa 400px'ten fazla kaydırılınca beliren yüzen buton.
- **Not ekleme çift tıklama**: Tek tıkla kazara not açılması yerine artık çift tıklama gerekiyor (`TafsirContentView` `onDoubleClick`; çift tıkta tarayıcının seçtiği kelime temizleniyor).
- **Arapça tooltip çakışması**: Kelime Türkçesi tooltip'i yukarı yerine aşağı açılıyor (üstteki sticky panelle çakışma giderildi).
- **Banner metni**: "Metin günümüz Türkçesine sadeleştirildi, hata bulunabilir." olarak güncellendi.
- tsc temiz, lint temiz (yalnızca önceden var olan font uyarısı), `next build` compiled successfully.

---

### 2026-06-04 (3. iş) — Soft delete + audit log (denetim kaydı)

Yönetici paneline iki güvenlik özelliği eklendi: kullanıcı silme artık geri alınabilir (soft delete) ve tüm admin işlemleri denetim kaydına yazılıyor.

- **Şema**: `User.deletedAt DateTime?` (null=aktif) + yeni `AuditLog` modeli (actorId/actorEmail snapshot — admin silinse bile iz kalır, FK yok; action, targetType/Id/Label, metadata Json). Neon'a `db push` ile eklendi (additive).
- **Soft delete**: `DELETE /api/admin/users/[id]` artık veriyi yok etmiyor, `deletedAt` damgalıyor (not/vurgular korunur). `?permanent=1` → gerçek hard delete (KVKK silme talepleri için). `auth.ts`: `deletedAt` dolu kullanıcı giriş yapamıyor. `users` listesi varsayılan aktifler; `?includeDeleted=1` ile hepsi.
- **Geri yükleme**: `PATCH { restore: true }` → `deletedAt = null`.
- **Audit log**: `src/lib/audit.ts` `recordAudit()` (hata olsa bile asıl işlemi bozmaz). Rol değişimi, doğrulama, soft/hard delete, restore kaydediliyor. `GET /api/admin/audit` (ADMIN, son 100).
- **UI**: Kullanıcılar sekmesine "Silinmişleri göster" filtresi + silinmiş satır (soluk, 🗑 rozeti) için Geri Yükle / Kalıcı Sil; aktifte Sil (soft). Yeni **"Denetim Kaydı" sekmesi** (`DenetimTab`) — okunabilir Türkçe etiketli işlem geçmişi. Panel artık **5 sekme**.
- tsc/lint/build temiz; db push sonrası Neon'a karşı doğrulandı (deletedAt + AuditLog çalışıyor).

---

### 2026-06-04 (2. iş) — Site trafiği analitiği + Vercel Web Analytics

Yönetici paneline ziyaretçi/sayfa görüntüleme analitiği eklendi. **Önemli bulgu**: Vercel Web Analytics verisi hiçbir planda API ile çekilemiyor (Hobby'de hiç; programatik erişim yalnızca Pro+ "Drains" ve o da analitik verisi vermiyor) — bu yüzden Vercel'i panele bağlamak yerine **kendi çerezsiz analitiğimiz** kuruldu.

- **Vercel Web Analytics** (önceki adım): `@vercel/analytics` + root layout'a `<Analytics />`. Veriler Vercel dashboard'da; panele bağlanamıyor (API yok).
- **Kendi analitik (panele bağlı)**:
  - `prisma/schema.prisma` → yeni **`PageView`** modeli (path, referrer, visitorKey, country, device, createdAt). Neon'a `prisma db push` ile eklendi (additive).
  - **Çerezsiz tekil ziyaretçi**: `visitorKey` = günlük tuz (`NEXTAUTH_SECRET` + tarih) + IP + UA → SHA256. Ham IP saklanmaz, anahtar her gün değişir → kalıcı takip yok, KVKK dostu. Tekil ziyaretçi = gün içi distinct visitorKey (7/30g sayıları üst sınır göstergesi).
  - `src/app/api/track/route.ts` (public POST): bot/önizleme UA filtresi, yalnızca `/` ile başlayan yollar, country `x-vercel-ip-country`'den, referrer host'a indirgenir (kendi domain → null/iç gezinme). Hata sessizce yutulur.
  - `src/components/AnalyticsTracker.tsx`: layout'ta route değişiminde `navigator.sendBeacon('/api/track')`; `/yonetici` sayılmaz (kendi trafiğimiz hariç).
  - `src/app/api/admin/analytics/route.ts` (ADMIN): bugün/7g/30g pageview+tekil ziyaretçi (tek sorguda FILTER), 30 günlük günlük seri, en çok gezilen sayfalar, yönlendiren kaynaklar (raw SQL).
  - **Yeni "Trafik" sekmesi** (`TrafikTab.tsx`): 6 kart + 30 günlük SVG sparkline (pageview & ziyaretçi) + top sayfalar + top referrers. Panel artık 4 sekme.
- **Not**: `/api/track` middleware matcher'ında değil → public. Lokal build'de `prisma:error postgresql://` mesajı shell `file:./dev.db` tuzağından (üretimi etkilemez). tsc/lint/build temiz; build alt-işlemi typescript'e eriştiği için **`next build` sandbox kapalı** çalıştırıldı.

---

### 2026-06-04 — Yönetici paneli profesyonelleştirildi (3 sekme, grafikler, içerik kapsamı)

Tek sayfalık basit yönetici paneli (`/yonetici`) çok daha gelişmiş, profesyonel ve fonksiyonel bir 3 sekmeli yapıya dönüştürüldü. `page.tsx` artık ince bir sekme kabuğu; her sekme kendi verisini çeken ayrı client bileşeni. Grafikler için **bağımlılıksız SVG** tercih edildi (kullanıcı kararı; son kullanıcı bundle'ı etkilenmiyor, route-level chunk).

- **① Genel Bakış**: 6 istatistik kartı (kullanıcı, doğrulanmış %, vurgu, not, okuma işareti, ayet) + gerçek sadeleştirme ilerleme bar'ı (612/68.552 = %0.9) + 3 büyüme trend grafiği (son 30 gün kümülatif SVG sparkline: kullanıcı/not/vurgu) + en aktif kullanıcılar
- **② Kullanıcılar** (derinleştirildi): e-posta doğrulama rozeti + tek tıkla **manuel doğrula** (artık `verify-user.ts` scriptine gerek yok), rol/durum filtreleri, sıralama (yeni/eski/aktiflik), okuma işareti sütunu, client-side sayfalama (20'şer)
- **③ İçerik & Modernizasyon** (yeni): toplam/sadeleştirilmiş özet + başlanan/tamamlanan sure sayısı, 11 tefsir bazında kapsam barları, 114 sure bazında ilerleme (arama + "yalnızca başlananlar" filtresi)
- **API**: `stats` genişletildi (büyüme zaman serisi `$queryRawUnsafe` + date_trunc, doğrulanmış/modernize sayıları); `users` (emailVerified + readMarkCount); `users/[id]` PATCH artık emailVerified toggle destekliyor; **yeni `/api/admin/content`** (tefsir & sure bazında kapsam, raw SQL). Hepsi `ADMIN` korumalı.
- **Yeni dosyalar**: `src/app/yonetici/{types.ts, ui.tsx, GenelBakisTab.tsx, KullanicilarTab.tsx, IcerikTab.tsx}`, `src/app/api/admin/content/route.ts`
- **Doğrulama**: tsc temiz, lint temiz, build başarılı; raw SQL sorguları gerçek Neon DB'ye karşı test edildi (Fâtiha 77/77, Bakara 535 sadeleştirilmiş → toplam 612)

---

### 2026-06-03 (2. oturum) — Bekleyen işler tamamlandı + teknik borç temizliği

Önceki oturumdan commit'lenmemiş kalan iş bağlandı ve bekleyen denetim bulguları temizlendi:

- **DB script tuzağı kalıcı çözüldü**: `scripts/load-env.ts` eklendi — `dotenv` `{ override: true }` ile yüklenip shell'den miras alınan eski `DATABASE_URL=file:./dev.db` değerini `.env`'deki Neon URL ile eziyor. `check-user.ts` ve `verify-user.ts` artık `import "./load-env"` kullanıyor; bu scriptler **`env -u …` olmadan** doğrudan `npx tsx scripts/...` ile çalışıyor (test edildi: tuzaklı env'le bile Neon'a bağlandı). Not: export profil dosyalarında değil, Claude Code'u başlatan parent süreçten geliyor — bu yüzden çözüm script tarafında yapıldı.
- **Kozmetik / teknik borç**:
  - `package.json` adı `tefsir-projesi` → `tefsirnet`
  - `.claude/` (yerel hafıza/ayar dizini) `.gitignore`'a eklendi
  - Eski modernize logları silindi (`modernize-bakara.log` ~2MB, `modernize-bakara-ollama.log`)
- **574 MB `prisma/dev.db` korunuyor**: Neon ile birebir karşılaştırıldı (TafsirContent 68.552/68.552, `originalText` 68.552/68.552 dolu, `modernizedAt` 612/612) — Neon eksiksiz kaynak, dev.db onun eski kopyası. Kullanıcı kararıyla çevrimdışı acil yedek olarak diskte tutuluyor (gitignored, silinmedi).

---

### 2026-06-03 — Kullanıcı giriş sorunu çözüldü (Merve Budak) + admin script'leri

Kullanıcı "Merve Budak" giriş yapamıyordu. Veritabanı incelemesinde hesabın mevcut ancak `emailVerified: false` olduğu görüldü; `src/lib/auth.ts` doğrulanmamış e-postada girişi `EMAIL_NOT_VERIFIED` ile reddediyor (doğrulama e-postası ulaşmamış/spam'a düşmüş olabilir). Kullanıcı onayıyla `emailVerified` manuel olarak `true` yapıldı.

- `scripts/check-user.ts` eklendi — ada/e-postaya göre kullanıcı arar ve durum (emailVerified, role…) gösterir
- `scripts/verify-user.ts` eklendi — verilen e-postayı manuel doğrulanmış işaretler (`set-admin.ts` deseninde)
- **Dikkat**: Shell'de eski SQLite'tan kalma `DATABASE_URL=file:./dev.db` export'u var; bu scriptler `env -u DATABASE_URL -u DIRECT_URL npx tsx ...` ile çalıştırılmalı (dotenv mevcut env'i ezmiyor). Kalıcı çözüm: `~/.zshrc`'den o export'u kaldırmak

---

### 2026-06-01 — Orijinal tefsir metni ifşası kaldırıldı (güvenlik/içerik)

Denetimde tespit edildi: modernleştirilmemiş tefsirler yayında tamamen gizli (tüm giriş noktalarında `modernizedAt` kapısı var), **ancak** modernleştirilmiş tefsirlerde "Orijinali göster" butonu sadeleştirme öncesi orijinal (eski Türkçe) metni son kullanıcıya sunuyordu. Gereksinim: yayında orijinallerin hiçbiri bulunmamalı.

- `api/tafsir/.../route.ts`: yanıttan `originalText` çıkarıldı
- `TafsirReader.tsx`: "Orijinali göster" butonu, `showOriginal` state'i ve `originalText` tip alanı kaldırıldı; içerik daima sadeleştirilmiş `text` gösteriyor
- `originalText` DB sütunu ham yedek olarak korundu (yalnızca artık sunulmuyor)
- tsc/lint/build temiz

---

### 2026-06-01 — Tam denetim sonrası 8 düzeltme

Baştan sona denetim yapıldı; tespit edilen sorunlardan 8 tanesi düzeltildi (tsc temiz, lint temiz, build başarılı):

- **Arama harf duyarlılığı (regresyon)**: `api/search` içindeki 6 `contains` sorgusuna `mode: "insensitive"` eklendi — SQLite→Postgres geçişinde arama büyük/küçük harf duyarlı olmuştu
- **ESLint kuruldu**: `.eslintrc.json` (`next/core-web-vitals` + `next/typescript`) eklendi; `npm run lint` artık çalışıyor. Çıkan hatalar (PrintView kaçırılmamış tırnaklar) ve kullanılmayan değişken uyarıları temizlendi
- **Sürüm hizalama**: `eslint-config-next` 15.0.3 → ^15.5.18 (next ile uyumlu)
- **Rate limiter sağlamlaştırıldı**: modül seviyesindeki `setInterval` (edge'de güvenilmez) yerine çağrı başına tembel süpürme; dağıtık ortam sınırı koda açıkça belgelendi
- **Şifre politikası**: kayıt min 6 → 8 + e-posta format doğrulaması; tüm client/sunucu noktaları (kayıt, şifre sıfırlama, şifre değiştirme) 8'e hizalandı
- **Ölü kod**: middleware'deki kullanılmayan `PUBLIC_PAGES` kaldırıldı
- **.env tutarsızlığı**: `.env.example`'a kullanılan `GEMINI_API_KEY` dokümante edildi; kullanılmayan `OPENROUTER_API_KEY` `.env`'den kaldırıldı (modernize script yalnızca gemini/ollama destekliyor)
- **Kullanılmayan alanlar**: `html`/`originalHtml` tefsir API yanıtından ve client tipinden çıkarıldı (görüntülemede hiç render edilmiyordu); DB sütunları ham yedek olarak korundu, şema yorumu netleştirildi

Henüz ele alınmayan denetim bulguları: büyük log dosyaları + 602 MB `prisma/dev.db` (eski SQLite, gitignored) ve `package.json` adı (`tefsir-projesi`) — kozmetik.

---

### 2026-06-01 — Proje durum kontrolü

- Proje genel sağlık kontrolü yapıldı: TypeScript hata yok, branch main ile senkron
- `.claude/` hafıza sistemi dizini oluşturuldu
- CLAUDE.md'deki eskimiş "unstaged değişiklikler" notu temizlendi

---

### 2026-06-01 — progress.md format temizliği

- `progress.md` içindeki tüm `**Ne Yapıldı:**` ibareleri kaldırıldı

---

### 2026-06-01 — CLAUDE.md ve progress.md oluşturuldu

- Proje hafıza sistemi kuruldu: `CLAUDE.md` (teknik hafıza) ve `progress.md` (ilerleme günlüğü) sıfırdan yazıldı
- Git geçmişi, Prisma şeması, package.json ve son commit'ler taranarak güncel proje durumu belgelendi

---

### 2026-06-01 — Misafir modu, güvenlik ve PostgreSQL geçişi

- Misafir (üye olmadan) okuma modu eklendi; not/vurgu için üye olma yönlendirmesi gösteriliyor
- Misafir uyarısında giriş sayfasına yönlendirme kaldırıldı; misafir metne tıklayınca not modalı açılmıyor
- Giriş ekranında uzun ayetlerin Arapçasının kırpılması önlendi
- HTTP güvenlik başlıkları eklendi (`X-Frame-Options`, `CSP` vb.), middleware düzeltildi, Turbopack'e geçildi
- Next.js 15.0.3 → 15.5.18 (CVE-2025-66478 güvenlik açığı kapatıldı)
- Neon PostgreSQL'e geçiş için `scripts/migrate-to-neon.ts` scripti eklendi
- E-posta doğrulama linki `/verify-email` API rotasına yönlendirildi
- Resend API key aktif edildi, admin rol atama scripti (`scripts/set-admin.ts`) eklendi

---

### 2026-05-27 — Giriş ekranı, üst bar ve arama iyileştirmeleri

- Auth ekranları birleştirildi; üst bar markası `tefsir.net` yapıldı
- Arama: sure adları + mealler + tefsir metinleri + not/vurgu kapsamına alındı
- Vurgu davranışı yeşil altı çizili stile geçirildi; not gizle/göster eklendi
- `TafsirReadMark` modeli ile okudum işareti eklendi
- Notlar için panel başlığı "Notlarım"; çıkış yalnızca Hesabım'da
- Bookmark senkron: `bookmark-events` ile `ResumeButton` anında güncelleniyor
- Arapça kelime hover: Türkçe anlam tooltip (api.acikkuran.com)
- Kelime kelime ve okunuş satırları kaldırıldı

---

### 2026-05-27 — Elmalılı kaldırma ve AI modernizasyon altyapısı

- T012/T013 (Elmalılı) ve `tr.yazir` meal tüm kod ve veritabanından temizlendi; toplam 11 tefsir (T001–T011)
- `scripts/modernize-tafsirs.ts`'e Ollama (`qwen3:8b`) provider desteği eklendi
- Throttle limitleri: `--pauseMs`, `--batchSize`, `--ollamaThreads`, `--numCtx` parametreleri
- Fâtiha modernizasyonu doğrulandı: 77/77 tamam

## 🐛 Bilinen Sorunlar
- Modernizasyon `modernize-tafsirs.ts` Ollama ile çalışırken çok kaynak tüketir; `--pauseMs=8000 --ollamaThreads=2` ile hafiflet
- Dev sunucu hata verirse: `rm -rf .next && npm run dev` (eski chunk önbelleği)

## 💡 Kararlar ve Notlar
- Modernizasyon `modernizedAt IS NULL` olanları işler; kesilirse aynı komutla kaldığı yerden devam eder
- `originalText` ham scrape yedeği olarak korunur
- SQLite → Neon PostgreSQL geçişi Vercel'deki kalıcı disk problemi nedeniyle yapıldı
