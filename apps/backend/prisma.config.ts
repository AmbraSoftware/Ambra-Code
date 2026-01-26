// -----------------------------------------------------------------------------
// NODUM KERNEL - PRISMA 7 CONFIGURATION
// Versão: 4.0.1 (Prisma 7.2.0 Compliant)
// Segurança: Enterprise Grade - Connection String Isolation
// -----------------------------------------------------------------------------

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    // Schema location (relative to this config file)
    schema: './prisma/schema.prisma',

    // Migrations configuration
    migrations: {
        path: './prisma/migrations',
        seed: 'ts-node prisma/seed.ts',
    },

    // Database connection
    datasource: {
        // Type-safe env() helper (dotenv/config loaded above)
        url: env('DATABASE_URL'),
        // Direct connection for migrations (bypasses pooler)
        // Supabase Pooler (port 6543) doesn't support migrations
        // Use direct connection (port 5432) instead
        directUrl: env('DIRECT_URL'),
    },
});
