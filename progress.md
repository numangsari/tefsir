# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

### 2026-06-10 (17. iş) — Çok-ajan ortak hafıza altyapısı kuruldu ✅

- AGENTS.md okundu; Claude Code / Codex / Gemini CLI / Antigravity CLI ortak çalışma protokolü incelendi
- `docs/ai-memory/` dizinindeki 5 ortak hafıza dosyası (current-state, architecture, decisions, known-issues, handoff) boş şablondan çıkarılıp projenin gerçek durumunu yansıtır hale getirildi

**Değiştirilen Dosyalar:**
- `docs/ai-memory/current-state.md`: Mevcut özellikler ve bekleyen görevler
- `docs/ai-memory/architecture.md`: Sistem yapısı, bileşenler, deployment
- `docs/ai-memory/decisions.md`: Mimari kararlar gerekçeleriyle
- `docs/ai-memory/known-issues.md`: Bilinen sorunlar ve çözüm yolları
- `docs/ai-memory/handoff.md`: Son çalışma devri özeti

**Sonraki Adımlar:**
- [ ] FavoriteTafsir DB migration: `env -u DATABASE_URL -u DIRECT_URL npx prisma db push`
- [ ] Gerçek cihazda mobil dokunmatik testi

### 2026-06-08 (16. iş) — 3 mobil sorun düzeltmesi ✅

- **Tooltip taşma** (`AyahArabicWithTooltip`): kenar kelimelerde tooltip ekran dışına çıkıyordu → ref callback ile `translateX` clamp + `max-w-[9rem] whitespace-normal`
- **Profil özet grid** (`profil/page.tsx`): `grid-cols-2` → `grid-cols-[auto_1fr]`, uzun e-posta artık taşmıyor
- **ScrollToTopButton safe-area**: `bottom-20` → `calc(5rem+env(safe-area-inset-bottom,0px))`, iPhone X+ notch'ta tab bar ile örtüşme giderildi

**Değiştirilen Dosyalar:**
- `src/components/AyahArabicWithTooltip.tsx`
- `src/app/profil/page.tsx`
- `src/components/ScrollToTopButton.tsx`

### 2026-06-08 (15. iş) — Mobil önceki/sonraki ayet butonu + favori tefsir özelliği ✅

**Düzeltme 1 — Mobil önceki/sonraki ayet butonları yarım görünüyordu:**
`<nav aria-label="Ayet gezinme">` alt sekme çubuğu (~60px sabit) tarafından örtülüyordu.
`mb-20 md:mb-0` eklenerek çözüldü; kullanıcı nav içeriğini sekme çubuğunun üzerinde kaydırabilir.

**Düzeltme 2 — Favori Tefsir özelliği:**
- `prisma/schema.prisma`: `FavoriteTafsir` modeli eklendi (userId + tafsirId, unique index)
- `api/my/favorite-tafsirs`: GET/POST/DELETE endpoint'i
- `OkuReaderShell.tsx`: favori id'leri fetch + `sortedTafsirs` (favs önce) + `handleAdvance` güncellendi; `toggleFavorite` optimistik
- `TafsirReader.tsx`: `favoriteTafsirIds` + `onFavoriteToggle` prop'ları; her tefsir öğesine ★ butonu (girişli kullanıcılara); favori olunca amber renk
- `profil/page.tsx`: "Favori Tefsirler" bölümü — tüm 11 tefsir ★ toggle ile listelenir

**Gerekli:** `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` (production Neon'a FavoriteTafsir tablosunu ekle)

**Değiştirilen Dosyalar:**
- `prisma/schema.prisma`: FavoriteTafsir modeli + User/Tafsir ilişkileri
- `src/app/api/my/favorite-tafsirs/route.ts`: Yeni (oluşturuldu)
- `src/app/oku/[surah]/[ayah]/page.tsx`: nav mb-20 md:mb-0
- `src/components/OkuReaderShell.tsx`: favori state + sıralama + toggle
- `src/components/TafsirReader.tsx`: ★ butonu + favoriteTafsirIds/onFavoriteToggle prop
- `src/app/profil/page.tsx`: Favori Tefsirler bölümü

tsc/build temiz. DB migration kullanıcı onayı gerektirir.

### 2026-06-07 (14. iş) — Mobil hamburger menü tıklanamıyor düzeltildi ✅

`backdrop-blur-md` eklenen `<header>` elementi CSS stacking context oluşturdu ama `position: static` olduğu için içindeki `z-index` etkisizleşti ve dropdown diğer sayfa elementlerinin altında kalıyordu.

**Düzeltme:** `TopBar.tsx` — `<header>` sınıfına `relative z-50` eklendi; dropdown artık header'a göre konumlanıyor ve z-index düzgün çalışıyor.

**Değiştirilen Dosyalar:**
- `src/components/TopBar.tsx`: header'a `relative z-50` eklendi

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

### 2026-06-07 (10. iş) — Efektli/modern tasarım yenilemesi (yalnız görsel)

Kullanıcı, paylaştığı koyu zeminli "proje yönetim paneli" görsellerindeki gibi **modern ve efektli** bir tasarım istedi — **içerik/fonksiyon hiç değişmeden**, yalnız görsel. Kararlar (kullanıcıyla): kapsam = tüm site, tema = her ikisi de korunur (koyuda tam efekt, açıkta yumuşatılmış), okuyucu = ölçülü efekt (çevre camlı, metin alanı sade/kontrastlı).

**Yaklaşım — merkezi tasarım katmanı (komponent bazlı değil):**
- `globals.css`: (1) **ambient ışıma arka planı** — `body::before` ile emerald/teal radyal gradyanlar (koyuda güçlü, açıkta düşük opaklık), koyu taban `#0a0a0a`; (2) `@layer components` yeniden kullanılabilir sınıflar: `.surface-glass` (cam yüzey: backdrop-blur + yarı saydam + iç/dış gölge), `.surface-glass-hover` (emerald hover glow), `.btn-glow` (emerald gradyan pill + glow), `.btn-outline-glow` (saydam pill), `.badge-glow`; (3) `animate-fade-up` + reduced-motion. Mevcut `.hl/.note-inline/.arabic/.tefsir-body/toast` **birebir korundu**.
- `tailwind.config.ts`: `fontFamily.serif = [var(--font-serif), ...]`, `boxShadow.glow/glow-lg`, `fade-up` keyframe/animation.
- `layout.tsx` + `globals.css`: zarif serif font **Newsreader** — `next/font` yerine `<link>` ile runtime'da yüklendi (build-time ağ bağımlılığı yok), `:root --font-serif` ile bağlandı.

**Doğrulama:** `tsc --noEmit` temiz, `npm run build` temiz.

### 2026-06-06 (9. iş) — Ana sayfa güncellemeleri + okuma ilerlemesi

Kullanıcı ana sayfa ve birkaç UI iyileştirmesi istedi (ekran görüntüsüyle).

**Uygulananlar:** (1) Hero açıklama metni güncellendi. (2) Hero'da sembol sağına büyük **"tefsir.net"** kelime markası eklendi. (3) `TopBar`'daki hadis-i şerif fontu büyütüldü. (4) Arama ikonu büyütüldü. (5) **Hesabım → "Okuma ilerlemesi"** bölümü: `GET /api/my/progress` raw SQL ile her sûrede okunan tefsir-metni / toplam oranını döner; profilde her başlanan sûre için yüzde + ilerleme barı.

**Karar (kullanıcıyla):** yüzde = tam tefsir kapsamı; liste yalnız başlanan sûreleri gösterir. **Yeni DB kolonu yok**, deploy ile çalışır. tsc/build temiz.

### 2026-06-06 (8. iş, ek) — İletişim yanıtı site adına gönderiliyor

Panelden "Yanıtla" artık `mailto:` linki (Mac Mail) yerine site adından (noreply@tefsir.net) Resend ile yanıt gönderiyor.

**Uygulananlar:** (1) `sendContactReply` + `contactReplyTemplate`. (2) `POST /api/admin/contact/reply` (ADMIN; Resend, okundu işareti, `recordAudit('contact.reply')`). (3) `IletisimTab.tsx`: satır içi yanıt kutusu. (4) Denetim sekmesine "Mesaj yanıtlandı" etiketi. **Yeni DB kolonu yok**, deploy ile çalışır. tsc/build temiz.

## 🐛 Bilinen Sorunlar
- Modernizasyon `modernize-tafsirs.ts` Ollama ile çalışırken çok kaynak tüketir; `--pauseMs=8000 --ollamaThreads=2` ile hafiflet
- Dev sunucu hata verirse: `rm -rf .next && npm run dev` (eski chunk önbelleği)

## 💡 Kararlar ve Notlar
- Modernizasyon `modernizedAt IS NULL` olanları işler; kesilirse aynı komutla kaldığı yerden devam eder
- `originalText` ham scrape yedeği olarak korunur
- SQLite → Neon PostgreSQL geçişi Vercel'deki kalıcı disk problemi nedeniyle yapıldı
