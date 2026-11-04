import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. Next.js renders small inline bootstrap scripts, so
 * script-src needs 'unsafe-inline' (a nonce-based policy would force every page to be
 * rendered dynamically). Everything else is locked to this origin: no third-party
 * scripts, no framing, no plugins, forms can only post back here.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Product photos and map tiles come from https hosts; uploads are data: URLs.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation is used by the delivery-location picker; nothing else is needed.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Vercel already sends HSTS; add it ourselves when self-hosting (Docker / VPS).
  ...(!isDev && !process.env.VERCEL
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `docker build` sets NEXT_OUTPUT=standalone for a small self-contained server image.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Dev only: hosts other than localhost (e.g. your LAN IP, to test on a phone) must be
  // allowed explicitly, or Next.js blocks hot reload and fonts for them.
  // Example in .env.local: DEV_ALLOWED_ORIGINS=10.33.56.21,192.168.1.20
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",").map(host => host.trim()).filter(Boolean),
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API responses are per-user data: never let a shared cache store them.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'chaldal.com',
      },
      {
        protocol: 'https',
        hostname: 'www.chaldal.com',
      },
      {
        protocol: 'https',
        hostname: 'www.shwapno.com',
      }
    ],
  },
};

export default nextConfig;
