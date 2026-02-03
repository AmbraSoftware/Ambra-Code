import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        perf_hooks: false,
        child_process: false,
      };
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@nestjs/core': false,
        '@nestjs/common': false,
      };
    }
    return config;
  },
};

export default nextConfig;
