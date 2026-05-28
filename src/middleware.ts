import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const AUTH_ROUTES = new Set(["/api/kayit", "/api/auth/forgot-password", "/api/auth/reset-password"]);

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const ip = getIp(req);

    // Kayıt ve şifre sıfırlama endpoint'lerine rate limit
    if (AUTH_ROUTES.has(pathname)) {
      const { allowed, retryAfterMs } = rateLimit(ip, pathname, {
        limit: 5,
        windowMs: 15 * 60 * 1000, // 15 dakikada 5 istek
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
    }

    // NextAuth giriş endpoint'ine rate limit
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
    }

    // Yönetici sayfaları için ADMIN rolü zorunlu
    if (pathname.startsWith("/yonetici") || pathname.startsWith("/api/admin")) {
      const role = (req.nextauth?.token as { role?: string } | undefined)?.role;
      if (role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Yetki yok." }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/oku", req.url));
      }
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Rate limit için kontrol edilecek public API'ler token gerektirmez
        if (AUTH_ROUTES.has(pathname)) return true;
        return !!token;
      },
    },
    pages: { signIn: "/" },
  }
);

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
