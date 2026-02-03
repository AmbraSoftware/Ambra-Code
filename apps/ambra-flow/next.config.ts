import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@nodum/shared'],
  webpack: (config, { isServer }) => {
    // Ignorar módulos do NestJS em ambos os lados (server e client)
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        perf_hooks: false,
        child_process: false,
      };
    }
    
    // Ignorar todos os módulos do NestJS no bundle
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@nestjs/core': false,
      '@nestjs/common': false,
      '@nestjs/swagger': false,
      '@nestjs/microservices': false,
      '@nestjs/websockets': false,
      '@nestjs/mapped-types': false,
      '@nestjs/platform-express': false,
      'class-transformer': false,
      'class-validator': false,
    };
    
    // Adicionar IgnorePlugin para módulos opcionais do NestJS
    const { IgnorePlugin } = require('webpack');
    config.plugins = config.plugins || [];
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /^@nestjs\/(core|common|swagger|microservices|websockets|mapped-types|platform-express)$/,
      }),
      new IgnorePlugin({
        resourceRegExp: /^class-transformer/,
      }),
      new IgnorePlugin({
        resourceRegExp: /^class-validator/,
      })
    );
    
    return config;
  },
};

export default nextConfig;
