import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@nodum/shared'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        perf_hooks: false,
        child_process: false,
      };
      // Ignorar todos os módulos do NestJS no client bundle
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@nestjs/core': false,
        '@nestjs/common': false,
        '@nestjs/swagger': false,
        '@nestjs/microservices': false,
        '@nestjs/websockets': false,
        '@nestjs/mapped-types': false,
        'class-transformer/storage': false,
      };
      
      // Adicionar IgnorePlugin para módulos opcionais do NestJS
      const { IgnorePlugin } = require('webpack');
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /^@nestjs\/(core|common|swagger|microservices|websockets|mapped-types)$/,
        }),
        new IgnorePlugin({
          resourceRegExp: /^class-transformer\/storage$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
