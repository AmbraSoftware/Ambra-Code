import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PWA Configuration
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
