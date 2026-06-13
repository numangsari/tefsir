# Son Çalışma Devri

_Son güncelleme: 2026-06-13 — Cursor_

## Yapılanlar
- Merkezi şifre politikası eklendi: `src/lib/password-policy.ts`
- Kayıt, şifre sıfırlama ve profil şifre değiştirme API'leri + ilgili formlar güncellendi
- Kurallar: min 8 / max 128 karakter, harf + rakam zorunlu, tekrarlayan karakter ve yaygın şifre listesi reddi, e-posta benzerliği kontrolü (kayıt/değiştir/sıfırla)

## Doğrulama
- `npm run lint` — geçti
- `npx tsc --noEmit` — geçti

## Açık Sorunlar
1. **FavoriteTafsir DB migration** (⚠️ en yüksek öncelik): Production Neon'a henüz push edilmedi.
2. **AI modernizasyon**: ~612/68k — uzun soluklu arka plan işi.
3. **Mobil dokunmatik testi**: Gerçek cihaz doğrulaması yapılmadı.

## Sonraki Adım
- Mevcut kullanıcıların zayıf şifreleri otomatik zorlanmaz; isteğe bağlı girişte zorunlu şifre yenileme eklenebilir.
