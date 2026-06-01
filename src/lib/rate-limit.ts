// Basit in-memory rate limiter — sliding window (kayan pencere) takibi.
//
// DİKKAT — dağıtık ortam sınırı:
// Bellek tek instance/isolate'e özeldir. Vercel serverless/edge'de her bölge ya da
// soğuk başlatma ayrı belleğe sahip olduğundan limit instance başına uygulanır;
// kötü niyetli trafiğe karşı tam koruma sağlamaz. Sağlam (global) bir limit için
// Upstash Redis gibi harici bir store'a geçilmelidir. Bu sürüm, tek instance'ta
// kazara/önemsiz suistimali yavaşlatmak için yeterlidir.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Bellek sızıntısını önlemek için süresi geçmiş kayıtları seyrek aralıklarla temizle.
// Modül seviyesinde setInterval kullanmak yerine (edge runtime'da güvenilmez ve
// kontrolsüz timer bırakır) her N çağrıda bir tembel süpürme yapıyoruz.
let callsSinceSweep = 0;
const SWEEP_EVERY = 500;

function sweep(now: number) {
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function rateLimit(
  ip: string,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const mapKey = `${key}:${ip}`;
  const entry = store.get(mapKey);

  if (!entry || now > entry.resetAt) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
