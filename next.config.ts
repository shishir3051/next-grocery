import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: hosts other than localhost (e.g. your LAN IP, to test on a phone) must be
  // allowed explicitly, or Next.js blocks hot reload and fonts for them.
  // Example in .env.local: DEV_ALLOWED_ORIGINS=10.33.56.21,192.168.1.20
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",").map(host => host.trim()).filter(Boolean),
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
