// -----------------------------------------------------------------------------
// NODUM KERNEL - PRISMA 7 CONFIGURATION
// Versão: 4.0.2 (Railway Postgres Native)
// -----------------------------------------------------------------------------

import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
