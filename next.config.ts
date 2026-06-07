import type { NextConfig } from "next";

const securityHeaders = [
  // Clickjacking koruması — site iframe içinde gösterilemez
  { key: "X-Frame-Options", value: "DENY" },
  // Tarayıcı MIME sniffing yapmaz
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer bilgisi sadece aynı domain isteklerinde tam gönderilir
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kamera, mikrofon, konum izinleri kapalı
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // DNS prefetch — Google Fonts için hız kazanımı
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // İçerik Güvenlik Politikası (CSP)
  // script-src: Next.js hidrasyon ve NextAuth inline script gerektiriyor → unsafe-inline
  // style-src: Tailwind inline stil + Google Fonts
  // font-src: Amiri fontu (fonts.gstatic.com)
  // img-src: data URI ve blob (Next.js Image)
  // frame-ancestors: Hiçbir sitede iframe içine alınamaz
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
