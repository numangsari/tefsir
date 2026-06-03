/**
 * DB script'leri için ortam yükleyici.
 *
 * Shell'de eski SQLite'tan kalma `DATABASE_URL=file:./dev.db` export'u
 * miras alınabiliyor; varsayılan `dotenv/config` mevcut env'i EZMEDİĞİ için
 * Prisma yanlış URL ile başlar ("URL must start with postgresql://").
 * `override: true` ile `.env`'deki Neon URL'i shell değerini ezer.
 *
 * Kullanım: diğer importlardan ÖNCE `import "./load-env";` yaz
 * (ES modül import sırası korunur, böylece prisma yüklenmeden env hazır olur).
 */
import { config } from "dotenv";

config({ override: true });
