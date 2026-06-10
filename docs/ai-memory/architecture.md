# Mimari

_Son güncelleme: 2026-06-10 — Claude Code_

## Genel Yapı
```
tefsirnet/
├── src/
│   ├── app/                  # Next.js App Router sayfaları + API route'ları
│   │   ├── api/              # Route handler'lar (auth, my/*, admin/*, search, track, contact)
│   │   ├── oku/[surah]/[ayah]/  # Ana okuyucu sayfası + OG görseli
│   │   ├── yazdir/           # Yazdırma sayfası
│   │   ├── yonetici/         # Admin paneli (ADMIN rolü gerektirir)
│   │   ├── profil/           # Kullanıcı profili
│   │   ├── giris/ kayit/     # Auth sayfaları
│   │   └── iletisim/         # İletişim formu
│   ├── components/           # React bileşenleri
│   ├── lib/                  # Yardımcı modüller (reader-data, audit, tafsir-scroll, …)
│   └── data/                 # Statik veri (tafsirs.ts — 11 tefsir kataloğu)
├── prisma/
│   └── schema.prisma         # Veri modeli
├── scripts/                  # DB taşıma, AI modernizasyon, kullanıcı yönetim scriptleri
└── docs/ai-memory/           # Çok-ajan ortak hafıza
```

## Ana Bileşenler ve Sorumlulukları
| Bileşen | Sorumluluk |
|---------|-----------|
| `OkuReaderShell` | Sticky başlık + okuyucu birleşimi; favori tefsir sıralaması |
| `TafsirReader` | Tefsir listesi + içerik; masaüstü 3-sütun / mobil sekmeli |
| `AyahWordBridge` | Arapça–meal çift yönlü kelime vurgusu |
| `AuthUnified` | Giriş/kayıt birleşik form |
| `AnalyticsTracker` | sendBeacon ile çerez-siz ziyaret kaydı |
| `JsonLd` | schema.org JSON-LD (WebSite, Article, Breadcrumb) |
| `src/lib/reader-data.ts` | React cache + unstable_cache ile SSR veri katmanı |
| `src/lib/audit.ts` | Admin işlem kaydı (AuditLog) |
| `src/lib/clean-tafsir-text.ts` | Tefsir başı/sonu ayet numarası temizleme |

## Veri Akışı
1. Kullanıcı `/oku/[surah]/[ayah]` açar → `reader-data.ts` SSR'da Neon'dan veri çeker.
2. İstemci tarafı: favori tefsirler `/api/my/favorite-tafsirs` GET ile alınır; sıralama OkuReaderShell'de.
3. Ziyaret → `/api/track` (sendBeacon); yönetici → `/api/admin/analytics`.
4. Arama → `/api/search` (Postgres full-text).

## Deployment
- Vercel (fra1 bölgesi) + Neon PostgreSQL (eu-central-1)
- Build: `prisma generate && next build`
- Ortam değişkenleri: DATABASE_URL, DIRECT_URL (Neon pooled/direct), NEXTAUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY
