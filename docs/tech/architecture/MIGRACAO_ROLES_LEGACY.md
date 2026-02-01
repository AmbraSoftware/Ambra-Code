# ⚠️ Migration Necessária - Remoção de Roles Legacy

## 🎯 Contexto

Removemos as roles legacy (`GLOBAL_ADMIN`, `OPERATOR_ADMIN`, `CANTEEN_OPERATOR`) do enum `UserRole` no código, mas **é necessário criar uma migration do Prisma** para atualizar o banco de dados.

---

## 📋 Migration SQL Necessária

**IMPORTANTE:** PostgreSQL não permite remover valores de ENUM diretamente. É necessário:

1. **Criar novo enum sem roles legacy**
2. **Migrar dados existentes**
3. **Substituir enum antigo pelo novo**

### Passo 1: Criar Migration

```bash
cd apps/backend
npx prisma migrate dev --create-only --name remove_legacy_roles
```

### Passo 2: Editar migration.sql

```sql
-- Migration: remove_legacy_roles

-- 1. Criar novo enum temporário
CREATE TYPE "UserRole_new" AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'MERCHANT_ADMIN',
  'OPERATOR_SALES',
  'OPERATOR_MEAL',
  'GOV_ADMIN',
  'GUARDIAN',
  'STUDENT',
  'CONSUMER'
);

-- 2. Migrar dados existentes
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'GLOBAL_ADMIN';
UPDATE "users" SET "role" = 'MERCHANT_ADMIN' WHERE "role" = 'OPERATOR_ADMIN';
UPDATE "users" SET "role" = 'OPERATOR_SALES' WHERE "role" = 'CANTEEN_OPERATOR';

-- 3. Atualizar coluna para usar novo enum
ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- 4. Atualizar array de roles (se houver dados)
UPDATE "users" 
SET "roles" = ARRAY['SUPER_ADMIN']::"UserRole_new"[] 
WHERE 'GLOBAL_ADMIN' = ANY("roles");

UPDATE "users" 
SET "roles" = ARRAY['MERCHANT_ADMIN']::"UserRole_new"[] 
WHERE 'OPERATOR_ADMIN' = ANY("roles");

UPDATE "users" 
SET "roles" = ARRAY['OPERATOR_SALES']::"UserRole_new"[] 
WHERE 'CANTEEN_OPERATOR' = ANY("roles");

-- 5. Remover enum antigo e renomear novo
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
```

---

## ⚠️ Atenção

**Esta migration é destrutiva** e requer:
- Backup do banco antes de executar
- Verificação de que não há usuários com roles legacy em produção
- Teste em ambiente de desenvolvimento primeiro

---

**Status:** ⚠️ **Aguardando Migration Manual**
