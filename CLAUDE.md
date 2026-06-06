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
| `src/components/AyahWordBridge.tsx` | Arapça–meal çift yönlü kelime vurgusu (tooltip kelimenin altında açılır) |
| `src/components/ScrollToTopButton.tsx` | Sayfa kaydırılınca beliren "en üste çık" yüzen butonu |
| `src/lib/clean-tafsir-text.ts` | Tefsir metni baş/sonundaki ayet numarası işaretini temizler — `(6)`, `﴾ 6 ﴿`, `{6}` (`cleanTafsirText` → `{ text, trimStart }`); API + yazdırma sayfası kullanır |
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
- [ ] **Analitik canlı doğrulaması**: deploy sonrası `tefsir.net` ziyaret edilip yönetici → Trafik sekmesinde veri düşüyor mu kontrol et (ilk veriler birkaç dk içinde). Vercel Analytics dashboard'u ayrıca etkinleştirilmeli (Vercel proje → Analytics → Enable)
- [ ] **`prisma db push` shell tuzağı**: db migration'ı her zaman `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` ile çalıştır (shell'deki `file:./dev.db` yoksa Neon yerine SQLite'a gider). Ayrıca güvenlik sınıflandırıcısı production DB push'u engelleyebilir → kullanıcı onayı gerekir
- [ ] Olası sonraki adımlar: içerik sekmesinden modernizasyon tetikleme / kullanıcı detay modalı / CSV dışa aktarma / analitik için bot filtresini güçlendirme
- [ ] Yeni özellik veya hata bildirimi gelirse buraya ekle

## Son Güncelleme
2026-06-06 (2. iş) — Okuyucu akışı II (canlı geri bildirim): (1) "Sıradaki" butonu mevcut tefsiri sessizce okundu yapıyor (`persistReadMark`/`handleSiradaki`); (2) "Burada kaldım" dikey konumu localStorage'a yakalanıp (`tafsir-scroll.ts`) resume linkine `?pos=` ile dönülünce `TafsirContentView.scrollToOffset` ile geri yükleniyor (konum cihaza özel — üretim DB push'undan kaçınıldı); (3) `﴾ 6 ﴿`/`{6}` süslü-Arapça parantezli ayet no temizliği `cleanTafsirText`'e eklendi; (4) sticky başlık yüksekliği `ResizeObserver`→`--ayah-sticky-h` ile ölçülüp yan panellerin top/max-h'ı bağlandı (üstten kesilme düzeldi); (5) sağ panel ipucu "çift tıklayın"; (6) sağ panel vurgu/not listesinden tıklayınca metinde o öğeye kaydırma (`jumpToAnchor`). tsc/lint/build temiz.
Önceki iş (2026-06-06, 1.) — Okuyucu akışı iyileştirmeleri (7 küçük UX): (1) OKU butonu okundu işaretleyince sıradaki tefsire/ayete geçiyor; (2) tefsir metni sonunda "Sıradaki" butonu — ikisi de `OkuReaderShell.handleAdvance` (`onAdvance` prop'u); (3) baş/sondaki ayet numarası ("(6)") temizliği `src/lib/clean-tafsir-text.ts` ile (API + yazdırma sayfasında; vurgu/not offset'leri `trimStart` kadar kaydırılıyor, yeni eklenenler `textTrimStart` ile ham koordinata çevriliyor); (4) `ScrollToTopButton`; (5) not ekleme artık çift tıklama; (6) Arapça tooltip aşağı açılıyor (çakışma giderildi); (7) banner "…hata bulunabilir". tsc/lint/build temiz.
Önceki iş (2026-06-04, 3.) — Soft delete + audit log. `User.deletedAt` + yeni `AuditLog` (Neon'a db push edildi). Kullanıcı silme artık geri alınabilir (soft); `?permanent=1` hard delete; `auth.ts` silinmiş hesabı reddediyor; `restore` ile geri yükleme. Tüm admin işlemleri `lib/audit.ts` → AuditLog'a yazılıyor; yeni "Denetim Kaydı" sekmesi (panel 5 sekme). tsc/lint/build temiz.
Önceki iş (2026-06-04, 2.) — Site trafiği analitiği eklendi. Vercel Web Analytics verisi API ile çekilemiyor (hiçbir planda public endpoint yok) → **kendi çerezsiz analitiğimiz** kuruldu: `PageView` modeli (Neon'a db push edildi), public `/api/track` (visitorKey = günlük tuz+IP+UA hash, ham IP saklanmaz), layout'ta `AnalyticsTracker` (sendBeacon, `/yonetici` hariç), ADMIN `/api/admin/analytics`, yeni **Trafik sekmesi** (panel artık 4 sekme). Ayrıca `@vercel/analytics` + `<Analytics />` eklendi (Vercel dashboard'da görünür, panele bağlanamaz). tsc/lint/build temiz (`next build` sandbox kapalı çalışır).
Önceki iş (2026-06-04, 1.): Yönetici paneli 3 sekmeye dönüştürüldü (Genel Bakış/Kullanıcılar/İçerik), bağımlılıksız SVG grafikler, content API. Commit'lendi (3392b38).
