## 📋 Project Summary
- **Purpose**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not, AI ile dil sadeleştirme
- **Technologies**: Next.js 15, React 18, Prisma, SQLite, NextAuth, Ollama (qwen3:8b), Tailwind
- **Status**: 🟡 In Progress
- **Started**: 2026-05
- **Last Updated**: 2026-05-27 (meal–Arapça kelime vurgusu)

---

## 🏗️ Technical Details

### Architecture
Next.js App Router uygulaması; tefsir verisi SQLite'ta, scrape script'leri tefsirsitesi.com'dan, mealler alquran.cloud'dan. AI sadeleştirme `scripts/modernize-tafsirs.ts` ile Ollama (lokal) veya Gemini üzerinden.

### File Structure
```
tefsir-projesi/
├── prisma/schema.prisma     → Veri modeli (11 tefsir)
├── prisma/dev.db            → Ana veritabanı (~574 MB)
├── src/app/oku/             → Okuyucu sayfası
├── src/app/arama/           → Arama sayfası (filtreli)
├── src/components/OkuReaderShell.tsx → Sticky başlık + okuyucu birleşimi
├── src/components/AyahWordBridge.tsx → Arapça-meal kelime eşlemeli vurgu
├── src/lib/ayah-word-align.ts → Kelime hizalama (oransal meal, index tabanlı)
├── src/lib/preferred-tafsir.ts → Seçili tefsir sessionStorage
├── src/app/api/my/tafsir-reads/ → Okudum işaretleri API
├── src/data/tafsirs.ts      → 11 tefsir kataloğu
├── scripts/
│   ├── scrape-tafsirs.ts
│   ├── scrape-translations.ts
│   └── modernize-tafsirs.ts → Gemini sadeleştirme
└── data/tafsir-export/      → JSON yedek (T001–T011)
```

### Dependencies
- **Ollama (qwen3:8b)**: Tefsir metinlerini lokal olarak günümüz Türkçesine çevirme
- **Prisma + SQLite**: Tefsir içerik ve kullanıcı verisi

### Key Decisions
- **Elmalılı tefsirleri kaldırıldı**: T012/T013 ve `tr.yazir` meal artık projede yok; toplam 11 tefsir (T001–T011)
- **Beklenen içerik sayısı**: Dinamik `tafsirCount × ayahCount` (admin istatistikleri)

---

## 📅 Revision History

### 2026-05-27 — Kelime kelime / okunuş satırları kaldırıldı

**What Was Done:**
- "Kelime kelime (Açık Kuran)" satırı kaldırıldı
- Ayet okunuşu (transkripsiyon) satırı kaldırıldı
- Arapça hover tooltip (Türkçe anlam) korundu

---

### 2026-05-27 — Açık Kuran UX (tooltip + kelime kelime)

**What Was Done:**
- Veri kaynağı: [acikkuran.com](https://acikkuran.com) API (`verseparts`)
- Arapça kelime hover: Türkçe anlam tooltip

**Modified Files:**
- `AyahArabicWithTooltip.tsx`, `MealSwitcher.tsx`, `AyahWordBridge.tsx`, `word-translation/route.ts`

---

### 2026-05-27 — Meal–Arapça doğru kelime eşlemesi (Açık Kuran)

**What Was Done:**
- Oransal hizalama kaldırıldı; **api.acikkuran.com/verseparts** ile Arapça kelime başına doğru `translation_tr`
- Örnek 1:1: `adıyla`↔بِسْمِ, `Allah'ın`↔ٱللَّهِ, `Rahman`/`Rahim`↔ ilgili Arapça kelimeler

**Modified Files:**
- `src/lib/ayah-word-align.ts`, `src/app/api/word-translation/.../route.ts`, `MealSwitcher.tsx`

---

### 2026-05-27 — Meal–Arapça kelime vurgusu yeniden kurulumu

**What Was Done:**
- Kök neden: Quran.com `word_translations` İngilizce döndürüyordu; `indexOf` ile meal eşlemesi başarısızdı
- `ayah-word-align.ts`: Arapça kelime filtreleme, oransal meal hizalama, karakter tabanlı meal span'leri
- API: yalnızca Arapça kelimeler Quran.com'dan; `tr` yerel meal'den oransal; fallback yerel `arabic`
- UI: 0 tabanlı `index`, tüm meal seçeneklerinde vurgu, `line-clamp` meal vurgusundan kaldırıldı

**Modified Files:**
- `src/lib/ayah-word-align.ts` (yeni)
- `src/app/api/word-translation/[surah]/[ayah]/route.ts`
- `src/components/AyahWordBridge.tsx`, `AyahArabicWithTooltip.tsx`, `MealSwitcher.tsx`

**User Feedback:**
> Meal arapça vurgusu çalışmıyor; gerekirse baştan kur.

**Next Steps:**
- [x] İndeks tabanlı kelime köprüsü
- [ ] Uzun ayetlerde hizalama kalitesini gözden geçir (isteğe bağlı iyileştirme)

---

### 2026-05-27 — Elmalılı kaldırma ve Bakara modernizasyonu

**What Was Done:**
- T012/T013 ve Elmalılı meal (`tr.yazir`) tüm kod ve veritabanından temizlendi
- `index.json`, şema yorumları ve istatistikler 11 tefsir olacak şekilde güncellendi
- Fâtiha AI sadeleştirmesi doğrulandı: **77/77** tamam (11 tefsir × 7 ayet)
- Bakara (sure 2) modernizasyonu arka planda başlatıldı (`npm run modernize -- --surah=2`)

**Modified Files:**
- `prisma/schema.prisma`, `src/data/tafsirs.ts`, `scripts/scrape-*.ts`, `scripts/export-tafsirs.ts`
- `src/app/api/admin/stats/route.ts`, `src/components/MealSwitcher.tsx`
- `data/tafsir-export/index.json`, `data/tafsir-export/README.md`

**User Feedback:**
> Elmalılıları sildim, komple kaldır. Fâtiha tamam, Bakara'dan devam et.

**Next Steps:**
- [x] Elmalılı referanslarını kaldır
- [x] Fâtiha modernizasyonunu doğrula
- [ ] Bakara (286 ayet × 11 tefsir = 3146 kayıt) modernizasyonunu tamamla
- [ ] Âl-i İmrân ve sonraki sureler için sırayla devam et

---

### 2026-05-27 — Ollama throttle ve bağlam açıklaması

**What Was Done:**
- Modernizasyon script'ine bilgisayarı yormamak için throttle limitleri eklendi
- Varsayılan Ollama ayarları: 4 sn ara, 15 kayıtta 90 sn dinlenme, 3 CPU thread, 8192 ctx
- Her API çağrısının bağımsız (stateless) olduğu kod yorumlarında belgelendi

**Modified Files:**
- `scripts/modernize-tafsirs.ts`: `--pauseMs`, `--batchSize`, `--batchPauseMs`, `--ollamaThreads`, `--numCtx`
- `.env.example`: Ollama throttle env değişkenleri

**User Feedback:**
> Bilgisayarı tamamen kullanmasın, limit koyalım. Sürekli yeni chat mi açıyor, bağlam penceresi kısıtlı.

**Next Steps:**
- [ ] Throttle ile Bakara modernizasyonunu yeniden başlat
- [ ] Gerekirse `--pauseMs=8000 --ollamaThreads=2` ile daha da yumuşat

---

### 2026-05-27 — Ollama geçişi (qwen3:8b)

**What Was Done:**
- `scripts/modernize-tafsirs.ts` dosyasına `--provider=ollama` desteği eklendi
- Script artık sağlayıcıyı (`gemini`/`ollama`) seçebiliyor ve Ollama için varsayılan model `qwen3:8b`
- Ollama ile canlı test yapıldı: Bakara için `--limit=1` koşusunda 1 kayıt başarıyla işlendi

**Modified Files:**
- `scripts/modernize-tafsirs.ts`: Çoklu provider desteği, Ollama çağrısı, varsayılan concurrency iyileştirmesi
- `progress.md`: Mimari ve revizyon geçmişi güncellendi

**User Feedback:**
> qwen3:8b kurulu, onunla devam edelim.

**Next Steps:**
- [x] Ollama provider desteğini ekle
- [x] qwen3:8b ile tek kayıt smoke test yap
- [ ] Bakara modernizasyonunu Ollama ile toplu devam ettir
- [ ] Gerekirse `--concurrency=2` deneyip hız/kalite dengesini ölç

---

### 2026-05-27 — Auth, okuyucu ve tooltip iyileştirmeleri

**What Was Done:**
- Auth ekranları birleştirildi: `/` ve `/giris` artık tek birleşik giriş/kayıt deneyimine bağlı
- Giriş ekranındaki hadis kaldırıldı; ayet kartında sure/ayet satırı Arapça ile Türkçe meal arasına taşındı
- Vurgu davranışı yeşil altı çizili stile geçirildi; not teması yeşil yapıldı
- Notlar için "gizle" eklendi; gizlenen notlar metinde sadece işaret (`✎`) olarak gösteriliyor
- Okuma ekranı üst başlığı scroll ile kompakt hale getirildi
- Tefsir görünmeme sorunu için okuyucuya tüm tefsir kataloğu bağlandı ve yükleme hata mesajı iyileştirildi
- Arapça kelime hover tooltip için harici API tabanlı `word-translation` route'u eklendi

**Modified Files:**
- `src/components/AuthUnified.tsx`
- `src/app/page.tsx`, `src/app/giris/page.tsx`, `src/app/kayit/page.tsx`
- `src/lib/auth.ts`, `src/app/oku/layout.tsx`
- `src/app/oku/[surah]/[ayah]/page.tsx`, `src/components/AyahStickyHeader.tsx`
- `src/components/AyahArabicWithTooltip.tsx`, `src/app/api/word-translation/[surah]/[ayah]/route.ts`
- `src/components/TafsirReader.tsx`, `src/components/TafsirContentView.tsx`, `src/components/AnnotationTools.tsx`, `src/components/NotesPanel.tsx`
- `src/app/globals.css`, `src/app/api/highlights/route.ts`

**User Feedback:**
> Giriş ekranlarını birleştir, vurguyu altı çiz yap, not gizleme ekle, sticky alanı küçült, tefsir yüklemeyi düzelt, Arapça kelime hover Türkçe göster.

**Next Steps:**
- [ ] Word tooltip Türkçe eşlemesini daha doğru veri kaynağıyla iyileştir
- [ ] Not gizleme durumunu kullanıcı bazlı kalıcı kaydetme (DB)
- [ ] Okuyucu başlığında mobil görünümü ek UX testinden geçir

---

### 2026-05-27 — Üst bar ve arama kapsamı güncellemesi

**What Was Done:**
- Giriş ekranında "Ayet" etiketi kaldırıldı; sure/ayet satırı ortalı ve daha belirgin hale getirildi
- Giriş ekranındaki gereksiz "Anasayfa" bağlantısı kaldırıldı
- Üst bar markası `tefsir.net` olarak güncellendi ve ortada hadis metni gösterildi
- Sağ menü etiketleri `Arama`, `Tefsir Oku`, `Notlarım`, `Hesabım` olarak değiştirildi
- `TafsirReader` sol panelindeki "Türkçe Tefsirler" başlığı kaldırıldı
- Arama altyapısı sure adları + mealler + tefsir metinleri + not/vurgu kapsayacak şekilde genişletildi
- Yeni `/arama` sayfası eklendi ve genişletilmiş arama sonuçları burada listelenir hale geldi

**Modified Files:**
- `src/components/AuthUnified.tsx`
- `src/components/TopBar.tsx`
- `src/components/TafsirReader.tsx`
- `src/app/api/search/route.ts`
- `src/components/SearchPalette.tsx`
- `src/app/arama/page.tsx`

**User Feedback:**
> Giriş ekranı ve üst menü metinlerini düzenle, markayı tefsir.net yap, aramayı sure/mealler/tefsirleri kapsayacak şekilde genişlet.

**Next Steps:**
- [x] Arama sonuçlarına filtre/sekmeler (sûre/meal/tefsir/not) ekle
- [x] `/arama` sayfasında sonuç snippet vurgusunu güçlendir

---

### 2026-05-27 — UX ve okuyucu iyileştirmeleri (10 madde)

**What Was Done:**
- Ayet değişince seçili tefsir korunuyor (`sessionStorage` + `?tafsir=` URL)
- "Bu ayetin notları" ve "Burada kaldım" sticky üst başlığa taşındı
- Girişli kullanıcı `/` → `/oku`; logo `tefsir.net` doğrudan okuyucuya; `ResumeButton` okuyucu layout'ta
- Arama: tür filtreleri (sûre/meal/tefsir/not/vurgu), sûre/âyet daraltma, geri tuşu, eşleşme vurgusu
- Arama sonucu tıklanınca ilgili yere gitme + `flash` ile 3 sn görsel vurgu
- Panel başlığı "Notlarım"; panelden şifre değiştir kaldırıldı (yalnızca Hesabım)
- Hesabım: rol satırı kaldırıldı; çıkış yalnızca Hesabım'da (üst bardan kaldırıldı)
- Tefsir listesinde "Okudum" işareti (`TafsirReadMark` modeli + API)

**Modified Files:**
- `src/components/OkuReaderShell.tsx`, `src/lib/preferred-tafsir.ts` (yeni)
- `src/components/TafsirReader.tsx`, `AyahStickyHeader.tsx`, `AyahSelector.tsx`
- `src/app/page.tsx`, `src/app/oku/layout.tsx`, `TopBar.tsx`, `ResumeButton.tsx`
- `src/app/arama/page.tsx`, `src/app/arama/layout.tsx`, `SearchPalette.tsx`, `SearchHighlight.tsx`
- `src/app/api/search/route.ts`, `src/app/api/my/tafsir-reads/route.ts`
- `src/app/panel/PanelView.tsx`, `src/app/profil/page.tsx`
- `prisma/schema.prisma` (`TafsirReadMark`)

**User Feedback:**
> Tefsir seçimi kalsın; not/burada kaldım görünür olsun; ara ekran kalksın; arama filtre ve vurgu; okudum işareti; çıkış hesapta.

**Next Steps:**
- [ ] Okudum işaretlerini panelde özet görünüm olarak listeleme (isteğe bağlı)
- [ ] Arama için Türkçe tam metin indeksi (FTS) değerlendirmesi

---

### 2026-05-27 — Not gizle, kelime köprüsü, PDF ikon, arama renkleri

**What Was Done:**
- Yeni not modalında "Kaydedince gizle" seçeneği
- AyahWordBridge: Arapça ↔ meal çift yönlü kelime vurgusu (Quran.com API)
- PDF yalnızca tefsir başlığında ikon; sidebar linki kaldırıldı
- Arama: üst barda ⌕ simgesi, kategori renkleri, tefsir sonucunda `find=` ile scroll+vurgu

**Modified Files:**
- `TafsirReader.tsx`, `TafsirContentView.tsx`, `AyahWordBridge.tsx`, `MealSwitcher.tsx`
- `SearchHighlight.tsx`, `TopBar.tsx`, `arama/page.tsx`, `SearchPalette.tsx`
- `api/word-translation/.../route.ts`, `oku/[surah]/[ayah]/page.tsx`

---

### 2026-05-27 — Bookmark senkron, oturum, üst başlık

**What Was Done:**
- Burada kaldım: `bookmark-events` ile ResumeButton anında güncellenir
- Çıkış: `signOutCompletely` + `SessionGuard` + middleware `no-store` + `refetchOnWindowFocus`
- Üst başlık: rozetler + araç çubuğu (gezinme | notlar | bookmark)

**Modified Files:**
- `bookmark-events.ts`, `sign-out.ts`, `SessionGuard.tsx`, `middleware.ts`
- `AyahStickyHeader.tsx`, `AyahSelector.tsx`, `BookmarkButton.tsx`, `ResumeButton.tsx`
- `auth.ts`, `Providers.tsx`, `profil/page.tsx`

---

### 2026-05-27 — UI ince ayar (okudum, bookmark, dev cache)

**What Was Done:**
- Okudum: satır içi yuvarlak işaret + tik ikonu
- Kaldığın yer: kompakt pill banner
- Burada kaldım: `disabled` beyazlaşma düzeltildi, aktif amber dolgu, toast geri bildirimi
- Dev 404/clientModules: `.next` temizlenip yeniden build

**Modified Files:**
- `BookmarkButton.tsx`, `ResumeButton.tsx`, `TafsirReader.tsx`

---

## 🐛 Known Issues
- Bakara modernizasyonu uzun sürer (~3000+ API çağrısı); `modernize-bakara.log` ile izlenebilir
- Dev sunucu hata verirse: `rm -rf .next && npm run dev` (eski chunk önbelleği)

## 💡 Notes and Decisions
- Modernizasyon `modernizedAt IS NULL` olanları işler; kesilirse aynı komutla kaldığı yerden devam eder
- `originalText` ham scrape yedeği olarak korunur
