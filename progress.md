# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

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
