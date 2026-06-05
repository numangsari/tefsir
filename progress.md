# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

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
