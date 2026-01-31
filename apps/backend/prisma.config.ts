// -----------------------------------------------------------------------------
// NODUM KERNEL - PRISMA 7 CONFIGURATION
// Versão: 4.0.1 (Prisma 7.2.0 Compliant)
// Segurança: Enterprise Grade - Connection String Isolation
// -----------------------------------------------------------------------------

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const usesDirectConnection = process.argv.includes('migrate') || process.argv.includes('db');

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
        url: usesDirectConnection ? env('DIRECT_URL') : env('DATABASE_URL'),
    },
});
