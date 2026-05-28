// Basit in-memory rate limiter — tek Vercel instance için yeterli.
// Her IP için sliding window (kayan pencere) takibi.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  ip: string,
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
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

// Eski kayıtları temizle (bellek sızıntısını önler)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}
