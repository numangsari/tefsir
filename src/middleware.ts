import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const AUTH_ROUTES = new Set(["/api/kayit", "/api/auth/forgot-password", "/api/auth/reset-password"]);

// Token gerektirmeyen public sayfalar
const PUBLIC_PAGES = new Set(["/", "/giris", "/kayit", "/sifremi-unuttum", "/emaili-dogrula"]);

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  // Kayıt ve şifre sıfırlama endpoint'lerine rate limit (token gerektirmez)
  if (AUTH_ROUTES.has(pathname)) {
    const { allowed, retryAfterMs } = rateLimit(ip, pathname, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen biraz bekleyin." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
    return NextResponse.next();
  }

  // Giriş endpoint'ine rate limit
  if (pathname === "/api/auth/callback/credentials") {
    const { allowed, retryAfterMs } = rateLimit(ip, "signin", {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Çok fazla giriş denemesi." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
    return NextResponse.next();
  }

  // NextAuth kendi iç endpoint'leri — dokunma
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // JWT token'ı oku
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Yönetici sayfaları için ADMIN rolü zorunlu
  if (pathname.startsWith("/yonetici") || pathname.startsWith("/api/admin")) {
    if (token?.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Yetki yok." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Giriş gerektiren sayfalar — token yoksa ana sayfaya yönlendir
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/oku/:path*",
    "/sureler/:path*",
    "/panel/:path*",
    "/profil/:path*",
    "/yonetici/:path*",
    "/yazdir/:path*",
    "/arama/:path*",
    "/api/highlights/:path*",
    "/api/notes/:path*",
    "/api/my/:path*",
    "/api/admin/:path*",
    "/api/search",
    "/api/kayit",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/callback/credentials",
  ],
};
