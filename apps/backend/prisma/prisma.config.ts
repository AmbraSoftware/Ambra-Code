// -----------------------------------------------------------------------------
// NODUM KERNEL - PRISMA 7 CONFIGURATION
// Versão: 4.0.1 (Prisma 7.2.0 Compliant)
// Segurança: Enterprise Grade - Connection String Isolation
// -----------------------------------------------------------------------------

import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      // Usa DIRECT_URL para migrations (evita problemas com prepared statements)
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
    },
  },
});
