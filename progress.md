# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Başlangıç**: 2026-05-26

## 📅 Revizyon Geçmişi

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
