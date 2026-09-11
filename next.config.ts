import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.hereco.in',
      },
      {
        protocol: 'https',
        hostname: 'www.hereco.in',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/festival',
        destination: 'https://www.hereco.in/api/festival',
      },
      {
        source: '/api/proxy/lottie/:path*',
        destination: 'https://media.hereco.in/festival-badges/:path*',
      },
    ];
  },
};

export default nextConfig;
