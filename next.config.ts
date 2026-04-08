import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
