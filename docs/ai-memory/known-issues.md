# Bilinen Sorunlar

_Doğrulanmış hataları, riskleri ve teknik borçları burada takip edin._

---

## ⚠️ FavoriteTafsir tablosu production'da yok
- **Durum**: Açık
- **Açıklama**: `prisma/schema.prisma`'daki FavoriteTafsir modeli yerel şemada mevcut ama Neon production DB'ye henüz push edilmedi. Canlıda `/api/my/favorite-tafsirs` çağrısı 500 hatası verebilir.
- **Çözüm**: `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` — kullanıcı onayı gerekir (production DB).

## Shell SQLite Tuzağı
- **Durum**: Çözüldü (load-env override ile)
- **Açıklama**: Parent shell'den miras kalan `DATABASE_URL=file:./dev.db` değişkeni Neon yerine SQLite'a yönlendirebilir.
- **Çözüm**: Tüm DB script'leri `import "./load-env"` kullanır; doğrudan `npx tsx scripts/*.ts` çalışır. `prisma db push` için `env -u DATABASE_URL -u DIRECT_URL npx prisma db push` kullan.

## AI Modernizasyon Tamamlanmadı
- **Durum**: Açık
- **Açıklama**: ~612/68.000 ayet modernize edildi (`modernize-tafsirs.ts`). Uzun süreli çalışma gerektiriyor.
- **Çözüm**: `--pauseMs` ve `--ollamaThreads` ile kaynak kısıtlayarak arka planda çalıştır.

## Mobil Dokunmatik Test Yapılmadı
- **Durum**: Açık
- **Açıklama**: 15-16. işlerdeki mobil düzeltmeler gerçek cihazda doğrulanmadı.
- **Kontrol**: Gerçek telefonda `/oku` aç; alt sekme çubuğu, tooltip, "Sıradaki" butonu, başlık kompaktlaşması.

## Dev Sunucu `.next` Önbellek Sorunu
- **Durum**: Bilinen teknik borç
- **Açıklama**: Zaman zaman Turbopack/Next.js önbelleği bozulabiliyor.
- **Çözüm**: `rm -rf .next && npm run dev`
