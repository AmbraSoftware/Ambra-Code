import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // PWA Configuration
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
