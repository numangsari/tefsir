# Mevcut Durum

_Son güncelleme: 2026-06-10 — Claude Code_

## Proje Özeti
Next.js 15 / React 18 / Prisma 5 / PostgreSQL (Neon) tabanlı Türkçe Kur'an tefsir okuma uygulaması.
Canlı: https://tefsir.net — Vercel (fra1) + Neon eu-central-1.

## Çalışan Özellikler
- 11 klasik Türkçe tefsir üzerinden ayet okuma (T001–T011)
- Misafir okuma modu; not/vurgu/favori için üye zorunluluğu
- Kullanıcı kayıt, e-posta doğrulama, giriş (NextAuth v4 + Resend)
- Arapça–meal çift yönlü kelime vurgusu (AyahWordBridge)
- Mobil okuyucu: alt sekme çubuğu (Tefsirler / Metin / Araçlar)
- Okuyucu "burada kaldım" scroll hafızası (localStorage)
- Favori tefsir özelliği (FavoriteTafsir, API, OkuReaderShell sıralaması, ★ butonu)
- Profil sayfası (okuma ilerlemesi, favori tefsirler)
- Yönetici paneli (5+1 sekme: Genel Bakış / Trafik / Kullanıcılar / İçerik / Denetim / İletişim)
- İletişim formu + admin yanıt (Resend)
- SEO: robots.ts, sitemap.ts, OG görsel (statik + ayet bazlı), JSON-LD
- Çerez-siz ziyaret analitiği (hash-tabanlı visitorKey)
- Arama (tam metin: sure + meal + tefsir + not)
- Yazdırma sayfası

## Aktif Çalışma Alanları / Bekleyen Görevler
- **FavoriteTafsir DB migration** ⚠️: Prisma şema değişikliği henüz production Neon'a push edilmedi.
  Komut: `env -u DATABASE_URL -u DIRECT_URL npx prisma db push`
- **AI tefsir modernizasyonu**: ~612/68k ayet modernize edildi (`modernize-tafsirs.ts`).
- **Mobil dokunmatik testi**: gerçek cihazda `/oku` akışı doğrulanmadı.
