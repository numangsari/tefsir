# tefsirnet — İlerleme

## 📋 Proje Özeti
- **Amaç**: Kur'an ayetlerini 11 klasik Türkçe tefsir üzerinden okuma, vurgu/not alma ve AI ile dil sadeleştirme
- **Teknolojiler**: Next.js 15, React 18, Prisma 5, PostgreSQL (Neon), NextAuth v4, Resend, Tailwind CSS
- **Durum**: 🟡 Devam Ediyor
- **Başlangıç**: 2026-05-26

## 🏗️ Teknik Detaylar

### Mimari
Next.js App Router; tefsir verisi PostgreSQL/Neon'da (önceden SQLite). AI sadeleştirme `scripts/modernize-tafsirs.ts` ile Ollama (lokal, qwen3:8b) veya Gemini üzerinden. Auth: NextAuth + Resend e-posta. Deploy: Vercel.

### Dosya Yapısı
```
tefsirnet/
├── prisma/schema.prisma          → Veri modeli (11 tefsir, kullanıcı, not, vurgu)
├── src/app/
│   ├── oku/[surah]/[ayah]/       → Ana okuyucu sayfası
│   ├── arama/                    → Arama sayfası (filtreli)
│   ├── yazdir/[surah]/[ayah]/    → Yazdırma sayfası
│   ├── panel/                    → Kullanıcı paneli
│   ├── yonetici/                 → Admin paneli
│   └── api/                      → API route'ları
├── src/components/
│   ├── TafsirReader.tsx          → Tefsir listesi + içerik paneli
│   ├── OkuReaderShell.tsx        → Sticky başlık + okuyucu birleşimi
│   ├── AyahWordBridge.tsx        → Arapça–meal kelime vurgusu
│   └── AuthUnified.tsx           → Giriş/kayıt birleşik ekranı
├── scripts/
│   ├── modernize-tafsirs.ts      → AI sadeleştirme (Gemini/Ollama)
│   ├── migrate-to-neon.ts        → SQLite → Neon taşıma
│   └── set-admin.ts              → Admin rol atama
└── data/tafsir-export/           → JSON yedek (T001–T011)
```

### Bağımlılıklar
- **Prisma + PostgreSQL/Neon**: Tefsir verisi ve kullanıcı verileri
- **NextAuth v4**: Oturum yönetimi
- **Resend**: E-posta doğrulama ve şifre sıfırlama
- **Ollama (qwen3:8b)**: Tefsir metinlerini lokal olarak günümüz Türkçesine çevirme

## 📅 Revizyon Geçmişi

### 2026-06-01 — CLAUDE.md ve progress.md oluşturuldu

**Ne Yapıldı:**
- Proje hafıza sistemi kuruldu: `CLAUDE.md` (teknik hafıza) ve `progress.md` (ilerleme günlüğü) sıfırdan yazıldı
- Git geçmişi, Prisma şeması, package.json ve son commit'ler taranarak güncel proje durumu belgelendi

**Değiştirilen Dosyalar:**
- `CLAUDE.md`: Yeni oluşturuldu
- `progress.md`: Yeni oluşturuldu

**Sonraki Adımlar:**
- [ ] Tüm unstaged değişiklikleri commit et

---

### 2026-06-01 — Misafir modu, güvenlik ve PostgreSQL geçişi

**Ne Yapıldı:**
- Misafir (üye olmadan) okuma modu eklendi; not/vurgu için üye olma yönlendirmesi gösteriliyor
- Misafir uyarısında giriş sayfasına yönlendirme kaldırıldı; misafir metne tıklayınca not modalı açılmıyor
- Giriş ekranında uzun ayetlerin Arapçasının kırpılması önlendi
- HTTP güvenlik başlıkları eklendi (`X-Frame-Options`, `CSP` vb.), middleware düzeltildi, Turbopack'e geçildi
- Next.js 15.0.3 → 15.5.18 (CVE-2025-66478 güvenlik açığı kapatıldı)
- Neon PostgreSQL'e geçiş için `scripts/migrate-to-neon.ts` scripti eklendi
- E-posta doğrulama linki `/verify-email` API rotasına yönlendirildi
- Resend API key aktif edildi, admin rol atama scripti (`scripts/set-admin.ts`) eklendi

**Değiştirilen Dosyalar:**
- `src/app/oku/[surah]/[ayah]/page.tsx`: Misafir modu
- `src/components/TafsirReader.tsx`: Misafir davranışı
- `src/app/api/ayah/[surah]/[ayah]/route.ts`, `api/search/route.ts`, `api/tafsir/.../route.ts`: Güvenlik/misafir
- `src/app/yazdir/[surah]/[ayah]/[tafsirId]/page.tsx`: Küçük iyileştirme
- `scripts/migrate-to-neon.ts`, `scripts/set-admin.ts`: Yeni script'ler

**Sonraki Adımlar:**
- [ ] Neon'a taşınma tamamlandıysa `scripts/migrate-to-neon.ts`'i belgele
- [ ] Unstaged değişiklikleri gözden geçir ve commit et
- [ ] Bakara ve sonraki surelerin AI modernizasyonuna devam et

---

### 2026-05-27 — Giriş ekranı, üst bar ve arama iyileştirmeleri

**Ne Yapıldı:**
- Auth ekranları birleştirildi; üst bar markası `tefsir.net` yapıldı
- Arama: sure adları + mealler + tefsir metinleri + not/vurgu kapsamına alındı
- Vurgu davranışı yeşil altı çizili stile geçirildi; not gizle/göster eklendi
- `TafsirReadMark` modeli ile okudum işareti eklendi
- Notlar için panel başlığı "Notlarım"; çıkış yalnızca Hesabım'da
- Bookmark senkron: `bookmark-events` ile `ResumeButton` anında güncelleniyor
- Arapça kelime hover: Türkçe anlam tooltip (api.acikkuran.com)
- Kelime kelime ve okunuş satırları kaldırıldı

**Sonraki Adımlar:**
- [x] Arama sonuçlarına filtre/sekmeler ekle
- [ ] Okudum işaretlerini panelde özet görünüm olarak listele (isteğe bağlı)
- [ ] Arama için Türkçe tam metin indeksi (FTS) değerlendirmesi

---

### 2026-05-27 — Elmalılı kaldırma ve AI modernizasyon altyapısı

**Ne Yapıldı:**
- T012/T013 (Elmalılı) ve `tr.yazir` meal tüm kod ve veritabanından temizlendi; toplam 11 tefsir (T001–T011)
- `scripts/modernize-tafsirs.ts`'e Ollama (`qwen3:8b`) provider desteği eklendi
- Throttle limitleri: `--pauseMs`, `--batchSize`, `--ollamaThreads`, `--numCtx` parametreleri
- Fâtiha modernizasyonu doğrulandı: 77/77 tamam

**Sonraki Adımlar:**
- [x] Elmalılı referanslarını kaldır
- [x] Fâtiha modernizasyonunu doğrula
- [ ] Bakara (286 × 11 = 3146 kayıt) ve sonraki surelerin modernizasyonu

## 🐛 Bilinen Sorunlar
- Modernizasyon `modernize-tafsirs.ts` Ollama ile çalışırken çok kaynak tüketir; `--pauseMs=8000 --ollamaThreads=2` ile hafiflet
- Dev sunucu hata verirse: `rm -rf .next && npm run dev` (eski chunk önbelleği)

## 💡 Kararlar ve Notlar
- Modernizasyon `modernizedAt IS NULL` olanları işler; kesilirse aynı komutla kaldığı yerden devam eder
- `originalText` ham scrape yedeği olarak korunur
- SQLite → Neon PostgreSQL geçişi Vercel'deki kalıcı disk problemi nedeniyle yapıldı
