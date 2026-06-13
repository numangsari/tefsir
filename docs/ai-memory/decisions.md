# Mimari Kararlar

_Yeni kararları tarih, karar ve gerekçe ile bu dosyanın sonuna ekleyin._

---

## 2026-05-26 — SQLite → Neon PostgreSQL
Vercel'de SQLite'ın kalıcı disk sorunu; Neon serverless Postgres daha güvenilir ve Vercel entegrasyonu doğrudan mevcut.

## 2026-05-26 — Elmalılı (T012/T013) kaldırıldı
Lisans ve telif hakları belirsizdi; katalog 11 tefsirle (T001–T011) sınırlı tutuldu.

## 2026-05-26 — Misafir okuma modu
Üye olmadan okuma serbest; not/vurgu/favori özellikleri üye girişi gerektirir. Dönüşüm hunisi yaklaşımı.

## 2026-05-26 — Vercel bölgesi fra1
Neon eu-central-1 ile aynı bölge seçilerek DB round-trip gecikmesi minimize edildi.

## 2026-05-26 — DB script'lerinde load-env override
Shell'de miras kalan `file:./dev.db` SQLite URL tuzağını önlemek için tüm DB script'leri `import "./load-env"` ile başlar; dotenv override modda `.env`'deki Neon URL'yi yükler.

## 2026-06-04 — Ana sayfa landing'e dönüştürüldü (8. iş)
`src/app/page.tsx` giriş/kayıt yerine tanıtım/landing sayfasına dönüştürüldü. Auth sayfaları `/giris` ve `/kayit`'e taşındı.

## 2026-06-08 — FavoriteTafsir modeli (15. iş)
`prisma/schema.prisma`'ya FavoriteTafsir modeli eklendi (userId + tafsirId, unique). API route `/api/my/favorite-tafsirs`. ⚠️ Production Neon'a henüz push edilmedi.

## 2026-06-13 — Merkezi şifre politikası
Tek noktadan doğrulama (`src/lib/password-policy.ts`); sunucu tarafında zorunlu, istemcide erken geri bildirim. Min 8 karakter + harf + rakam; yaygın şifre ve e-posta benzerliği reddi. Mevcut kullanıcı şifreleri geriye dönük zorlanmaz — yalnızca yeni kayıt, sıfırlama ve değiştirme akışlarında geçerli.
