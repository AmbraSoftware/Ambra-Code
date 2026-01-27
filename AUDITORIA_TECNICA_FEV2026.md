# 🔍 AUDITORIA TÉCNICA AMBRA - RELATÓRIO EXECUTIVO
**Data:** 26/01/2026  
**Modo:** Guerra (Lançamento Fev/2026)  
**Auditor:** CTO & Arquiteto de Software Principal

---

## 📋 SUMÁRIO EXECUTIVO

Esta auditoria identificou **3 violações críticas de arquitetura**, **dívida técnica significativa** na parametrização de taxas e **subutilização crítica** do `packages/shared` como Single Source of Truth. O código está funcionalmente operacional, mas viola princípios fundamentais de arquitetura definidos no `AMBRA_CONTEXT.md`.

---

## 🔴 RISCO CRÍTICO - VIOLAÇÕES DE ARQUITETURA

### 1. **Frontend Calculando Preço Total (VIOLAÇÃO GRAVE)**

**Arquivo:** `apps/ambra-flow/src/components/pos/CartSidebar.tsx:33`

```typescript
const total = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
```

**Problema:** O frontend está calculando o valor total do pedido antes de enviar ao backend. Isso viola a regra de **"Soberania do Backend"** definida no `AMBRA_CONTEXT.md`.

**Risco:**
- Divergência entre o que o frontend mostra e o que o backend cobra
- Possibilidade de manipulação de preços no cliente
- Falta de sincronização com descontos, taxas ou regras de negócio

**Evidência:** O backend recalcula o `totalAmount` em `apps/backend/src/modules/orders/orders.service.ts:134-159`, ignorando qualquer valor enviado pelo frontend. Isso é correto, mas o frontend não deveria calcular.

**Impacto:** 🟡 MÉDIO (Backend protege, mas UX pode divergir)

---

### 2. **DTOs e Interfaces Duplicados (VIOLAÇÃO DE CONTRATO)**

**Problema:** O `packages/shared` deveria ser o Single Source of Truth, mas existem DTOs duplicados em múltiplos lugares:

#### Backend (apps/backend/src):
- `modules/auth/dto/login.dto.ts` - **DUPLICADO** (existe em `packages/shared/src/dtos/auth.dto.ts`)
- `modules/orders/dto/create-order.dto.ts` - **DUPLICADO** (existe em `packages/shared/src/dtos/order.dto.ts`)

#### Frontend (apps/ambra-flow/src):
- `services/pos.service.ts:5-11` - `CreateOrderDto` **DUPLICADO**
- `services/stock.service.ts:3-30` - `Product`, `CreateProductDto` **NÃO EXISTEM NO SHARED**
- `services/financial.service.ts:12` - `Order` **NÃO EXISTE NO SHARED**
- `services/queue.service.ts:3-11` - `OrderItem`, `Order` **NÃO EXISTEM NO SHARED**

**Evidência de Não-Uso:**
```bash
# Nenhum import de @nodum/shared encontrado em:
- apps/backend/src/** (0 matches)
- apps/ambra-flow/src/** (0 matches)
```

**Impacto:** 🔴 **CRÍTICO** - Quebra de Type Safety e possibilidade de divergência de contratos

---

### 3. **Ausência de Constraint CHECK no Banco para Saldo Negativo**

**Arquivo:** `apps/backend/prisma/schema.prisma:439-461`

**Problema:** O modelo `Wallet` não possui constraint `CHECK` no banco de dados para prevenir `balance < 0`. A proteção existe apenas em código (validação em `transactions.service.ts:353-355`).

**Risco:**
- Race conditions podem permitir saldo negativo se múltiplas transações concorrentes passarem pela validação
- Bugs em código podem permitir atualizações diretas no banco sem validação
- Migrações ou scripts SQL podem corromper dados

**Evidência:**
```prisma
model Wallet {
  balance  Decimal  @default(0.00) @db.Decimal(12, 2)
  // ❌ FALTA: @@check(balance >= 0)
}
```

**Impacto:** 🟡 **MÉDIO-ALTO** - Proteção em código é boa, mas constraint de banco é camada adicional de segurança

**Nota Positiva:** O código usa `updateMany` com condição `balance: { gte: amountDecimal }` (linha 388), implementando **Optimistic Locking** com versionamento. Isso é excelente, mas não substitui constraint de banco.

---

## 🟡 DÍVIDA TÉCNICA

### 1. **Taxas Hardcoded (Ruim, mas Funcional)**

**Arquivo:** `apps/backend/src/modules/transactions/fee-calculator.service.ts:32-38`

```typescript
private readonly DEFAULTS: FeesConfig = {
  rechargeFixed: 0.00, // [DISABLED]
  rechargePercent: 0.0, // [DISABLED]
  creditRiskFixed: 0.00, // [DISABLED]
  creditRiskPercent: 0.0, // [DISABLED]
  convenienceFee: 0.00 // [DISABLED]
};
```

**Análise:**
- ✅ **BOM:** A arquitetura suporta taxas via `school.customFeesConfig` e `plan.feesConfig` (linhas 93-106)
- ❌ **RUIM:** As taxas estão zeradas via hardcode, não via configuração de banco/env
- ✅ **ACEITÁVEL:** Para o lançamento (Fev/2026), isso é funcional e seguro

**Recomendação:** Após lançamento, migrar para configuração via banco/env para permitir ativação sem deploy.

**Impacto:** 🟢 **BAIXO** (Funcional para lançamento, mas dívida técnica)

---

### 2. **packages/shared Subutilizado (CRÍTICO)**

**Estado Atual:**
- `packages/shared` contém apenas:
  - `enums.ts` (UserRole, ProductType, TransactionType, WalletType)
  - `dtos/auth.dto.ts` (LoginDto)
  - `dtos/order.dto.ts` (CreateOrderDto, CreateOrderItemDto)

**Faltando no Shared:**
- `Product` interface/type
- `Order` interface/type
- `OrderItem` interface/type
- `Student` interface/type
- `Wallet` interface/type
- `Transaction` interface/type
- Todos os outros DTOs do backend (30+ arquivos)

**Evidência de Não-Uso:**
- Backend: **0 imports** de `@nodum/shared`
- Frontend: **0 imports** de `@nodum/shared`

**Impacto:** 🔴 **CRÍTICO** - Quebra completa do princípio de Single Source of Truth

---

### 3. **Mobile Compliance (VERIFICADO - OK)**

**Arquivo:** `apps/ambra-food/services/api.ts`

**Status:** ✅ **COMPLIANT**

- Usa apenas `axios` para chamadas HTTP ao backend
- Não há uso de Supabase Client SDK
- Interceptors configurados corretamente para JWT
- Estrutura inicial (cart.tsx vazio) não viola regras

**Impacto:** 🟢 **NENHUM** (Conforme arquitetura)

---

## 🟢 AÇÃO IMEDIATA - BLOCKING ISSUE

### **REFATORAÇÃO PRIORITÁRIA: Unificar Contratos no `packages/shared`**

**Objetivo:** Garantir que Backend e Frontend falem a mesma língua com Type Safety total.

**Passos:**

1. **Migrar TODOS os DTOs do Backend para `packages/shared`:**
   - `LoginDto` (já existe, mas backend não usa)
   - `CreateOrderDto`, `OrderItemDto` (já existem, mas backend não usa)
   - `CreateProductDto`, `UpdateProductDto`
   - `RechargeDto`
   - `CreateUserDto`, `UpdateUserDto`
   - Todos os outros DTOs públicos

2. **Criar Interfaces/Types no `packages/shared`:**
   - `Product`, `Order`, `OrderItem`
   - `Student`, `Wallet`, `Transaction`
   - Tipos de resposta de API

3. **Refatorar Backend:**
   - Remover DTOs locais de `apps/backend/src/modules/*/dto/`
   - Importar de `@nodum/shared`
   - Manter apenas DTOs internos (se houver)

4. **Refatorar Frontend:**
   - Remover interfaces locais de `apps/ambra-flow/src/services/`
   - Importar de `@nodum/shared`
   - Remover cálculo de preço de `CartSidebar.tsx` (deixar backend calcular)

5. **Adicionar Constraint CHECK no Banco:**
   ```sql
   ALTER TABLE wallets ADD CONSTRAINT check_balance_non_negative 
   CHECK (balance >= 0);
   ```

**Estimativa:** 2-3 dias de desenvolvimento + 1 dia de testes

**Prioridade:** 🔴 **CRÍTICA** - Bloqueia Type Safety e pode causar bugs de produção

---

## 📊 MATRIZ DE RISCO

| Item | Severidade | Probabilidade | Impacto | Prioridade |
|------|------------|---------------|---------|------------|
| Frontend calculando preço | 🟡 Média | Alta | Médio | 🟡 Alta |
| DTOs duplicados | 🔴 Crítica | Alta | Crítico | 🔴 Crítica |
| Sem constraint CHECK | 🟡 Média | Baixa | Alto | 🟡 Média |
| Taxas hardcoded | 🟢 Baixa | N/A | Baixo | 🟢 Baixa |
| Shared subutilizado | 🔴 Crítica | Alta | Crítico | 🔴 Crítica |

---

## ✅ PONTOS POSITIVOS

1. **Atomicidade Financeira:** ✅ Excelente
   - Uso de transações `Serializable` no Prisma
   - Optimistic Locking com versionamento
   - Validação de saldo antes de débito

2. **Mobile Compliance:** ✅ Conforme arquitetura
   - Sem uso de Supabase Client
   - API centralizada via HTTP

3. **Segurança de Backend:** ✅ Robusta
   - Validação de saldo em múltiplas camadas
   - Isolamento de transações
   - Zero Trust (backend valida tudo)

4. **Arquitetura de Taxas:** ✅ Preparada
   - Estrutura suporta split/taxas
   - Configuração via banco/env pronta
   - Apenas desabilitada para lançamento

---

## 🎯 CONCLUSÃO

O código está **funcionalmente operacional** e **seguro para lançamento** (Fev/2026), mas viola princípios fundamentais de arquitetura definidos no `AMBRA_CONTEXT.md`. A **única ação blocking** é a unificação de contratos no `packages/shared` para garantir Type Safety total entre Backend e Frontend.

**Recomendação:** Executar a refatoração prioritária **ANTES** do lançamento para evitar bugs de produção relacionados a divergência de contratos.

---

**Assinado:**  
CTO & Arquiteto de Software Principal  
26/01/2026
