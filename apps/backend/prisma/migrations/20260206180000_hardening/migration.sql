-- ==========================================================
-- NODUM KERNEL: DATABASE HARDENING MIGRATION
-- Para executar no Railway: npx prisma migrate dev --name hardening
-- Ou via SQL direto no console do Railway
-- ==========================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. CONSTRAINTS DE INTEGRIDADE (CHECK CONSTRAINTS)
-- Garante que valores negativos sejam bloqueados no banco

-- Wallets - saldo não pode ser negativo
ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS chk_balance_not_negative;
ALTER TABLE "wallets" ADD CONSTRAINT chk_balance_not_negative CHECK (balance >= 0);

-- Wallets - limite diário não negativo
ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS chk_limit_not_negative;
ALTER TABLE "wallets" ADD CONSTRAINT chk_limit_not_negative CHECK ("dailySpendLimit" >= 0);

-- Transactions - valor não pode ser zero
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS chk_amount_nonzero;
ALTER TABLE "transactions" ADD CONSTRAINT chk_amount_nonzero CHECK (amount <> 0);

-- Products - preço não negativo
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS chk_price_not_negative;
ALTER TABLE "products" ADD CONSTRAINT chk_price_not_negative CHECK (price >= 0);

-- Products - estoque não negativo
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS chk_stock_not_negative;
ALTER TABLE "products" ADD CONSTRAINT chk_stock_not_negative CHECK (stock >= 0);

-- Orders - total não negativo
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS chk_total_not_negative;
ALTER TABLE "orders" ADD CONSTRAINT chk_total_not_negative CHECK ("totalAmount" >= 0);

-- Plans - desconto entre 0 e 100%
ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS chk_discount_range;
ALTER TABLE "plans" ADD CONSTRAINT chk_discount_range CHECK ("discountPercent" BETWEEN 0 AND 100);

-- 3. ÍNDICES PARA PERFORMANCE

-- Índice único para emails ativos (soft delete)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON "users" (email) WHERE "deletedAt" IS NULL;

-- Índice para documentos únicos (quando existir)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_document_hash_unique ON "users" ("documentHash") WHERE "documentHash" IS NOT NULL;

-- Índice para produtos disponíveis no menu
CREATE INDEX IF NOT EXISTS idx_products_active_menu ON "products" ("canteenId", "isAvailable") 
WHERE "deletedAt" IS NULL AND "isAvailable" = true;

-- 4. DEFAULTS E CONFIGURAÇÕES

-- Configura array default para wallets
ALTER TABLE "wallets" ALTER COLUMN "allowedDays" SET DEFAULT ARRAY[1,2,3,4,5];

-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON CONSTRAINT chk_balance_not_negative ON "wallets" IS 'Evita saldo negativo - regra de negócio crítica';
COMMENT ON CONSTRAINT chk_price_not_negative ON "products" IS 'Evita preços negativos no PDV';
COMMENT ON CONSTRAINT chk_stock_not_negative ON "products" IS 'Evita estoque negativo';

-- ==========================================================
-- MIGRAÇÃO CONCLUÍDA
-- ==========================================================
