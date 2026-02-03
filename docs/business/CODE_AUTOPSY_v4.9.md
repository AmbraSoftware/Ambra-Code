# RELATÓRIO DE ANÁLISE ESTÁTICA (CODE AUTOPSY)
## Ambra Platform v4.9 - Análise: Intenção vs. Realidade

**Data:** 02/02/2026  
**Auditor:** Backend Specialist / Security Auditor / Explorer  
**Metodologia:** Análise estática de Schema + Controllers + Services  
**Escopo:** 33 Controllers | 35+ Models | 28 Módulos

---

# PARTE 1: ANÁLISE DO BANCO DE DADOS (TABELA POR TABELA)

## 🔴 MODELOS CRÍTICOS - ALTA ATIVIDADE

### 1. `User` (236 linhas no schema)
**Intenção:** Gestão de identidade centralizada para todos os perfis (STUDENT, GUARDIAN, OPERATOR, ADMIN)

**Realidade:**
- ✅ **ALTAMENTE UTILIZADA** - Referenciada em 15+ services
- ✅ Campo `role` (single) quase deprecado - array `roles` sendo usado
- ⚠️ Campo `documentHash` existe mas NÃO é preenchido (hash não calculado)
- ⚠️ `nfcId` tem @unique mas sem índice composto com `schoolId` (pode causar conflito entre escolas)
- ⚠️ Soft delete (`deletedAt`) implementado mas `findOne` não filtra por ele

**Veredito:** 🛠️ OTIMIZAR
```sql
-- Índices recomendados:
CREATE INDEX idx_users_school_deleted ON users(schoolId, deletedAt) WHERE deletedAt IS NULL;
CREATE INDEX idx_users_nfc_school ON users(nfcId, schoolId); -- se NFC for por escola
```

---

### 2. `Order` + `OrderItem` (518 linhas)
**Intenção:** Core do negócio - pedidos e itens

**Realidade:**
- ✅ **CRÍTICO E ATIVO** - Transações seriais implementadas corretamente
- ✅ `orderHash` único para tracking
- ⚠️ `scheduledFor` existe mas sem índice (queries lentas de agendamento)
- ⚠️ `buyerId` vs `studentId` - distinção confusa em alguns controllers
- ⚠️ Não há `cancelledAt` ou `cancellationReason` (apenas status CANCELLED)

**Veredito:** 🛠️ OTIMIZAR
```sql
CREATE INDEX idx_orders_scheduled ON orders(scheduledFor) WHERE scheduledFor IS NOT NULL;
CREATE INDEX idx_orders_student_created ON orders(studentId, createdAt DESC);
```

---

### 3. `Transaction` (358 linhas)
**Intenção:** Ledger financeiro imutável

**Realidade:**
- ✅ **EXCELENTE** - Isolamento serializable, runningBalance, auditHash
- ✅ `offlineId` com @unique para idempotência offline
- ✅ `providerId` vincula a Asaas
- ⚠️ Campo `auditHash` existe mas NÃO é preenchido (cadeia de auditoria incompleta)
- ⚠️ `metadata` Json usado extensivamente (pode crescer sem limites)

**Veredito:** 🛠️ OTIMIZAR + 📋 REFATORAR
```typescript
// Implementar cálculo de auditHash:
const auditHash = crypto.createHash('sha256')
  .update(`${previousHash}${amount}${type}${timestamp}`)
  .digest('hex');
```

---

### 4. `Product` + `StockReservation` + `InventoryLog`
**Intenção:** Gestão de catálogo e estoque

**Realidade:**
- ✅ `version` para optimistic locking
- ✅ `deletedAt` soft delete implementado
- ✅ `StockReservation` com `orderId` (corrigido recentemente)
- ⚠️ `InventoryLog` - TABELA FANTASMA! Apenas 1 insert em `products.service.ts`
- ⚠️ `minStockAlert` sem mecanismo de alerta ativo ( apenas endpoint GET)
- ⚠️ `cost` campo existe mas nunca é preenchido (custo não rastreado)

**Veredito:** 🛠️ OTIMIZAR + 🗑️ CONSOLIDAR
```typescript
// InventoryLog deve ser populado em TODAS as movimentações:
// - StockService.reserveProductsInTransaction (falta)
// - StockService.finalizeOrderDeliveryInTransaction (falta)
// - OrdersService.cancelOrder (não existe endpoint!) (falta)
```

---

### 5. `Wallet` + `DailySpend`
**Intenção:** Carteira digital com limites e rastreamento diário

**Realidade:**
- ✅ `version` para optimistic locking
- ✅ `overdraftLimit` (SOS Merenda) implementado
- ✅ `DailySpend` com índice único wallet+date
- ⚠️ `creditLimit` existe mas NÃO é usado (apenas `overdraftLimit`)
- ⚠️ `negativeSince` existe mas não é atualizado automaticamente
- ⚠️ `dailySpendLimit` existe mas não bloqueia (só `canPurchaseAlone` bloqueia)

**Veredito:** 📋 REFATORAR
```typescript
// Remover campos não usados OU implementar lógica:
// - creditLimit → remover ou implementar crédito separado do overdraft
// - negativeSince → atualizar em debitFromWalletForOrderInTransaction
// - dailySpendLimit → validar em create() de Order
```

---

## 🟡 MODELOS MODERADAMENTE UTILIZADOS

### 6. `School` + `Canteen`
**Intenção:** Multi-tenancy e organização física

**Realidade:**
- ✅ RLS implementado corretamente via `schoolId`
- ✅ Soft delete em Canteen (`deletedAt`)
- ⚠️ `Canteen.openingTime/closingTime` como String (deveria ser Time ou validado)
- ⚠️ `School.status` (PENDING/ACTIVE/SUSPENDED) não bloqueia operações no código

**Veredito:** 🛠️ OTIMIZAR
```typescript
// Adicionar guarda em OrdersService.create():
if (school.status !== 'ACTIVE') throw new ForbiddenException();
```

---

### 7. `Plan` + `SchoolPlanHistory`
**Intenção:** SaaS billing e histórico de planos

**Realidade:**
- ✅ `target` (SCHOOL_SAAS vs GUARDIAN_PREMIUM) - distinção B2B/B2C
- ✅ `SchoolPlanHistory` para auditoria de mudanças
- ⚠️ `features` Json não tipado (any)
- ⚠️ `feesConfig` Json sobrescreve configuração global (precedência não clara)

**Veredito:** 🟢 MANTER

---

### 8. `Announcement`
**Intenção:** Comunicação institucional (broadcast)

**Realidade:**
- ✅ `scope` (GLOBAL/SYSTEM/SCHOOL/INDIVIDUAL)
- ✅ `targetIds` array para targeting específico
- ⚠️ Não há controle de leitura (read receipts) - "mensagem foi lida?"
- ⚠️ `targetRole` único - não suporta múltiplos roles (ex: OPERATOR_SALES + OPERATOR_MEAL)

**Veredito:** 🛠️ OTIMIZAR
```sql
-- Adicionar tabela de read receipts:
CREATE TABLE announcement_reads (
  announcementId UUID,
  userId UUID,
  readAt TIMESTAMP,
  PRIMARY KEY (announcementId, userId)
);
```

---

## 🟢 MODELOS BEM IMPLEMENTADOS

### 9. `WebhookEvent`
- ✅ Idempotência de webhooks Asaas
- ✅ `eventId` @unique para deduplicação
- ✅ `status` PENDING/PROCESSED/FAILED

### 10. `AuditLog`
- ✅ Hash chain (`previousHash`, `logHash`)
- ✅ RLS por `schoolId`
- ⚠️ Mas `AuditInterceptor` não popula `previousHash` corretamente

### 11. `RefundRequest`
- ✅ Estados completos (PENDING → WAITING_FUNDS → COMPLETED/REJECTED)
- ✅ Lock transaction e Original transaction separadas
- ✅ Relações duplas com Transaction

---

## 🗑️ MODELOS FANTASMAS / SUBUTILIZADOS

### 12. `InventoryLog` 🗑️ CRÍTICO
**Problema:** Apenas 1 insert no código inteiro!
```typescript
// Apenas em products.service.ts:updateStock()
await tx.inventoryLog.create({
  data: { productId, canteenId, change, reason: 'Ajuste manual...' }
});
```
**Impacto:** Perda total de rastreabilidade de estoque!

**Faltam em:**
- `StockService.reserveProductsInTransaction` 
- `StockService.finalizeOrderDeliveryInTransaction`
- `StockService.confirmSaleInTransaction`
- `OrdersService.updateStatus` (quando CANCELLED)

**Veredito:** 🚨 URGENTE - Implementar inserts faltantes

---

### 13. `DiscountRule` 🗑️ FANTASMA
**Problema:** Tabela existe, controller existe, mas:
- Não é referenciada em NENHUM service de pedido
- `OrdersService.create()` não aplica descontos
- `target` e `conditions` Json não são avaliados

**Veredito:** 🗑️ REMOVER ou 📋 IMPLEMENTAR (atualmente é código morto)

---

### 14. `Coupon` 🟡 PARCIAL
**Problema:** 
- CRUD completo em `GlobalAdminController`
- Mas `validateAndApplyCoupon` NÃO é chamado em `OrdersService.create()`
- Cupons existem mas não são aplicados em pedidos

**Veredito:** 📋 INTEGRAR ao fluxo de checkout

---

### 15. `WeeklyMenu` + `MenuRating` 🟡 PARCIAL
**Realidade:**
- ✅ CRUD existe em `canteen.service.ts`
- ✅ Ratings funcionam
- ⚠️ Mas `items` Json não tem estrutura tipada
- ⚠️ Não há integração com `Product` (cardápio não vincula produtos reais)

**Veredito:** 📋 REFATORAR para vincular a produtos

---

### 16. `NutritionalProfile` 🗑️ FANTASMA
**Problema:**
- Tabela existe, relação com User existe
- MAS não há controller, service ou endpoint
- Campos (`allergies`, `dailyCalorieGoal`, `aiInsights`) nunca são preenchidos

**Veredito:** 🗑️ REMOVER (feature não implementada)

---

### 17. `CategoryRestriction` + `ProductRestriction` 🟡 PARCIAL
**Realidade:**
- ✅ `checkRestrictions()` em `OrdersService.create()` as usa
- ✅ Restrições parentais funcionam
- ⚠️ Mas não há CRUD exposto (apenas populate manual no DB)

**Veredito:** 🛠️ EXPOR endpoints para gestão

---

### 18. `Favorite` ✅ BEM USADO
**Realidade:**
- ✅ `store.service.ts` implementa toggle e listagem
- ✅ Controller exposto em `StoreController`

---

### 19. `GuardianInvitation` 🟡 PARCIAL
**Realidade:**
- ✅ Fluxo de convite existe em `users.service.ts`
- ✅ Controller `invitations.controller.ts` expõe
- ⚠️ Mas `notifications.service.ts` NÃO é chamado (sem notificação real)

**Veredito:** 🛠️ ADICIONAR notificação

---

### 20. `Invoice` + `FiscalPendingItem` 🟡 PARCIAL
**Realidade:**
- ✅ Tabelas estruturadas para Nota Fiscal
- ⚠️ `FiscalModule` existe mas sem integração real com Sefaz
- ⚠️ `pdfUrl` nunca é preenchido

**Veredito:** 📋 IMPLEMENTAR integração fiscal ou remover

---

### 21. `SysConfig` 🗑️ FANTASMA
**Problema:**
- Tabela existe, relação com PlatformSystem
- Mas não há service, controller ou uso

**Veredito:** 🗑️ REMOVER

---

### 22. `PlatformSystem` + `Government` 🟡 B2G INCOMPLETO
**Realidade:**
- ✅ Estrutura para governos/prefeituras
- ✅ CRUD em `TenancyController`
- ⚠️ Mas não há lógica de negócio diferenciada (tipo Canteen.GOVERNMENTAL vs COMMERCIAL)

**Veredito:** 📋 IMPLEMENTAR regras B2G ou simplificar

---

### 23. `CashInFee` 🟢 BEM USADO
**Realidade:**
- ✅ Singleton (uma linha apenas)
- ✅ Usado em `FeesService` para cálculo de taxas
- ✅ Configurável via GlobalAdminController

---

### 24. `AuditKey` 🗑️ FANTASMA
**Problema:**
- Tabela existe
- Mas nunca é consultada ou preenchida

**Veredito:** 🗑️ REMOVER

---

### 25. `ConsentLog` ✅ LGPD
**Realidade:**
- ✅ Endpoint em `ConsentController`
- ✅ Chamado em fluxo de aceite de termos
- ✅ IP e UserAgent armazenados

---

### 26. `KitItem` ✅ KITS FUNCIONAM
**Realidade:**
- ✅ Auto-relacionamento Product via KitItem
- ✅ Lógica de reserva de componentes implementada

---

### 27. `Operator` 🟡 PARCIAL
**Realidade:**
- ✅ Dados fiscais e integração Asaas
- ✅ `isDataExpired` e `dataExpirationDate` para Bacen
- ⚠️ Mas `asaasToken` e `asaasApiKey` em texto plano (deveria ser criptografado)

**Veredito:** 🔒 CRIPTOGRAFAR credenciais

---

# PARTE 2: AUDITORIA DE ROTAS (API COVERAGE)

## 📊 MAPEAMENTO DE CONTROLLERS (33 encontrados)

### ✅ COBERTURA COMPLETA (CRUD + Regras de Negócio)

| Módulo | Controller | Status | Observação |
|--------|------------|--------|------------|
| Auth | `auth.controller.ts` | ✅ | Login, Register, Profile, Change Password |
| Users | `users.controller.ts` | ✅ | CRUD completo + Bulk + NFC + Stats + CSV Export |
| Users | `subscriptions.controller.ts` | ✅ | Premium B2C (Asaas integrado) |
| Users | `consent.controller.ts` | ✅ | LGPD compliance |
| Wallet | `wallet.controller.ts` | ✅ | Recharge, Cash-in, Lock/Unlock, Transactions |
| Wallet | `wallets.controller.ts` | ✅ | Admin limits update |
| Products | `products.controller.ts` | ✅ | CRUD + Stock Alerts + Stock Update |
| Orders | `orders.controller.ts` | ✅ | Create, List, Detail, Status Update |
| Store | `store.controller.ts` | ✅ | Favorites toggle |
| Tenancy | `tenancy.controller.ts` | ✅ | Schools + Governments CRUD (Global Admin) |
| Platform | `platform.controller.ts` | ✅ | Systems + Plans + Lifecycle + Dashboard |
| Platform | `global-admin.controller.ts` | ✅ | Metrics + Cash-in Fees + Coupons |
| Operators | `operators.controller.ts` | ✅ | CRUD + Link School |
| Canteen | `canteen.controller.ts` | ✅ | CRUD + Weekly Menu |
| Notifications | `notifications.controller.ts` | ✅ | Broadcast |
| Asaas | `asaas.controller.ts` | ✅ | Webhooks + Subaccount management |
| Fiscal | `fiscal.controller.ts` | ⚠️ | Endpoints mock (sem Sefaz) |
| Transactions | `transactions.controller.ts` | ⚠️ | Offline sync + Recharge manual |
| Import | `import.controller.ts` | ✅ | Bulk import de usuários |
| Dashboard | `dashboard.controller.ts` | ✅ | KPIs e métricas |
| Risk | `risk.controller.ts` | ⚠️ | Estrutura básica |
| AI | `ai.controller.ts` | 🗑️ | ??? (provavelmente mock) |

---

## 🚨 GAPS IDENTIFICADOS (FALTANTES)

### 1. CANCELAMENTO DE PEDIDO 🚨 CRÍTICO
```typescript
// NÃO EXISTE:
@Patch(':id/cancel')
async cancelOrder(@Param('id') id: string, @Body('reason') reason: string)

// Impacto:
// - Aluno não pode cancelar pedido PENDING
// - Operador não pode cancelar (apenas atualizar status, mas sem lógica de estorno)
// - Estoque fica preso em reservations ACTIVE
```

**Implementação necessária:**
```typescript
// orders.controller.ts
@Patch(':id/cancel')
@Roles(UserRole.STUDENT, UserRole.GUARDIAN, UserRole.OPERATOR_SALES, UserRole.SCHOOL_ADMIN)
async cancel(
  @Param('id') id: string,
  @Body('reason') reason: string,
  @CurrentUser() user: AuthenticatedUserPayload,
) {
  return this.ordersService.cancelOrder(id, reason, user);
}
```

---

### 2. ESTORNO/REFUND 🚨 CRÍTICO
```typescript
// RefundRequest existe no banco, mas NÃO há endpoint para criar!
// Apenas controllers administrativos de aprovação (se existirem)
```

**Faltante:**
```typescript
// refunds.controller.ts (NÃO EXISTE)
@Post()
@Roles(UserRole.GUARDIAN)
async requestRefund(
  @Body() dto: CreateRefundRequestDto,
  @CurrentUser() user: AuthenticatedUserPayload,
)
```

---

### 3. GESTÃO DE RESTRIÇÕES PARENTAIS 🚨 IMPORTANTE
```typescript
// ProductRestriction e CategoryRestriction existem
// Mas NÃO há endpoints para CRUD!
// Pais não conseguem restringir produtos via API
```

**Faltante:**
```typescript
// guardian-restrictions.controller.ts (NÃO EXISTE)
@Post('restrictions/products')
@Roles(UserRole.GUARDIAN)
async restrictProduct(...)

@Post('restrictions/categories')
@Roles(UserRole.GUARDIAN)
async restrictCategory(...)
```

---

### 4. NOTIFICAÇÕES PESSOAIS 🟡 MODERADO
```typescript
// notifications.controller.ts apenas tem broadcast (envio)
// Mas NÃO há endpoint para:
// - Listar notificações do usuário
// - Marcar como lida
// - Preferências de notificação
```

---

### 5. HISTÓRICO DE NOTAS FISCAIS 🟡 MODERADO
```typescript
// Invoice existe no banco
// Mas não há endpoint para usuário consultar suas NFes
```

---

### 6. EXTRATO DETALHADO COM FILTROS 🟡 MODERADO
```typescript
// transactions.controller.ts tem findAll básico
// Mas faltam:
// - Filtro por range de valores
// - Filtro por tipo (RECHARGE, PURCHASE, REFUND)
// - Export CSV/PDF
// - Gráficos/balance over time
```

---

## 🔄 REDUNDÂNCIAS IDENTIFICADAS

### 1. Múltiplos Controllers de "Plataforma"
```typescript
// platform.controller.ts      → Systems, Plans, Dashboard
// global-admin.controller.ts  → Metrics, Coupons, Fees
// tenancy.controller.ts       → Schools, Governments

// Problema: Separação conceitual não clara
// Sugestão: Consolidar em platform.controller.ts com @Controller('admin')
```

### 2. WalletController vs TransactionsController
```typescript
// wallet.controller.ts      → GET /wallet/transactions
// transactions.controller.ts → GET /transactions

// Ambos retornam transações do usuário
// Sugestão: Consolidar em transactions.controller.ts
```

### 3. UsersController tem muitas responsabilidades
```typescript
// users.controller.ts tem:
// - CRUD de usuários
// - Bulk import
// - NFC binding
// - Stats
// - CSV Export
// - Convites
// - Dependentes

// Sugestão: Quebrar em:
// - users.controller.ts (CRUD básico)
// - users-admin.controller.ts (stats, csv, bulk)
// - guardians.controller.ts (dependents, invitations)
```

---

## 🧟 ZOMBIE ROUTES (Rotas mortas/perigosas)

### 1. `/transactions/recharge` 🧟 PERIGOSA
```typescript
// transactions.controller.ts
@Post('recharge')
@Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
async createRecharge(@Body() body: { userId: string; amount: number })

// Problema:
// - Não usa DTO (any)
// - Não valida se usuário pertence à escola do admin
// - Permite recarga direta sem passar por Asaas (dinheiro "do nada")
```

**Veredito:** 🚨 REMOVER ou proteger com auditoria extensiva

---

### 2. `/ai/*` 🧟 DESCONHECIDO
```typescript
// ai.controller.ts existe mas conteúdo não auditado
// Provavelmente mocks ou experimentos
```

**Veredito:** 🗑️ REMOVER se não estiver em uso

---

### 3. `/fiscal/*` 🧟 MOCK
```typescript
// fiscal.controller.ts retorna dados mock
// Não integra com Sefaz real
```

**Veredito:** 📋 Implementar ou desativar

---

## 💡 SUGESTÕES DE OTIMIZAÇÃO (Query Params)

### 1. Consolidar listagens de pedidos
```typescript
// Atual:
GET /orders?studentId=xxx&status=PENDING
GET /orders/pending  (não existe, mas poderia ser criado)

// Sugestão: Já está bem, mas adicionar:
GET /orders?studentId=xxx&status=PENDING&dateFrom=2024-01-01&dateTo=2024-01-31&page=1&limit=20
```

### 2. Consolidação de buscas
```typescript
// Atual: Não existe endpoint de busca global
// Sugestão:
GET /search?q=termo&type=users|products|orders
// (Já existe em platform.controller.ts mas apenas para SUPER_ADMIN)
```

### 3. Relatórios consolidados
```typescript
// Atual:
GET /users/export-csv
// Sugestão:
GET /reports/financial?format=csv&startDate=xxx&endDate=yyy
GET /reports/inventory?format=pdf&canteenId=xxx
```

---

# PARTE 3: ACTION ITEMS PRIORIZADOS

## 🚨 CRÍTICO (Deploy bloqueante)

| # | Item | Arquivo | Esforço |
|---|------|---------|---------|
| 1 | Implementar `InventoryLog` em todas as movimentações de estoque | `stock.service.ts`, `orders.service.ts` | 2h |
| 2 | Criar endpoint de cancelamento de pedido | `orders.controller.ts` | 3h |
| 3 | Adicionar validação de `school.status` antes de criar pedido | `orders.service.ts` | 30min |
| 4 | Criptografar `asaasToken` e `asaasApiKey` | `Operator` model + migration | 2h |
| 5 | Implementar cálculo de `auditHash` em transactions | `transactions.service.ts` | 1h |

## 🛠️ OTIMIZAR (Performance/UX)

| # | Item | Motivação |
|---|------|-----------|
| 6 | Adicionar índice em `orders.scheduledFor` | Queries de agendamento lentas |
| 7 | Implementar integração de Cupons em checkout | Feature exists but not wired |
| 8 | Adicionar notificações em GuardianInvitation | UX issue |
| 9 | Criar endpoints de restrições parentais | Feature exists but not exposed |
| 10 | Consolidar controllers de Platform/GlobalAdmin | Code organization |

## 🗑️ REMOVER (Código morto)

| # | Item | Justificativa |
|---|------|---------------|
| 11 | Remover `NutritionalProfile` (tabela e relação) | Nunca implementado |
| 12 | Remover `SysConfig` | Nunca usado |
| 13 | Remover `AuditKey` | Nunca usado |
| 14 | Remover `DiscountRule` ou implementar | Código morto |
| 15 | Remover `transactions/recharge` endpoint | Perigoso, não valida propriedade |

## 📋 REFATORAR (Arquitetura)

| # | Item | Sugestão |
| 16 | Consolidar UsersController | Quebrar em 3 controllers menores |
| 17 | Implementar Read Receipts | Nova tabela para Announcement |
| 18 | Adicionar `cancelledAt` em Order | Audit trail |
| 19 | Remover campos não usados de Wallet | `creditLimit`, `negativeSince` |
| 20 | Implementar Fiscal Integration | Ou remover endpoints mock |

---

# CONCLUSÃO EXECUTIVA

## Pontos Fortes ✅
1. **RLS bem implementado** - `schoolId` em praticamente todas as queries
2. **Soft delete** - `deletedAt` usado consistentemente
3. **Auditoria** - `AuditInterceptor` em todos os endpoints críticos
4. **Transações** - Serializable transactions em operações financeiras
5. **Optimistic Locking** - `version` em Wallet e Product

## Pontos Fracos 🚨
1. **Rastreabilidade de Estoque** - `InventoryLog` incompleto (GAP CRÍTICO)
2. **Cancelamento de Pedido** - Não existe endpoint (GAP CRÍTICO)
3. **Código Morto** - 5+ tabelas/models não utilizados
4. **Acúmulo de Responsabilidades** - UsersController com 300+ linhas
5. **Segurança** - Credenciais Asaas em texto plano

## Recomendação Geral
**ANTES DO PILOTO:** Implementar items 1-5 da lista CRÍTICA.
**PÓS-PILOTO:** Revisar código morto e refatorar controllers grandes.

---

# 🔄 UPDATE PÓS-REANÁLISE CTO (02/02/2026)

Após reanálise minuciosa do CTO, ficou claro que vários itens identificados como "código morto" na autópsia técnica na verdade são **funcionalidades estruturantes P1/P2** que ainda não haviam sido conectadas ("fipadas"). Removê-las seria um erro estratégico grave.

Abaixo as correções implementadas:

---

## ✅ IMPLEMENTADO - Item 1: `transactions/recharge` (Recarga de Balcão)

**Diagnóstico Original:** "Endpoint perigoso - Remover"

**Realidade do Negócio:** Este é o endpoint de **Recarga de Balcão (Dinheiro Físico)** - P0 na Masterlist.

**Implementação:**
- ✅ Renomeado de `POST /transactions/recharge` para `POST /transactions/admin/cash-in`
- ✅ Adicionado DTO `CreateCashInDto` com validação completa
- ✅ Roles expandidos: `SCHOOL_ADMIN`, `SUPER_ADMIN`, `OPERATOR_SALES`
- ✅ Validação RLS: Operador só pode recarregar usuários da mesma escola
- ✅ Criado método `processCashIn()` em `TransactionService` com:
  - Transação serializable para consistência
  - Auditoria completa (operatorId, paymentMethod, notes)
  - Evento `transaction.cash-in.created` para notificações
  - Lógica de liberação de débito (limpa flags se saldo fica positivo)

**Arquivos Modificados:**
- `transactions.controller.ts`
- `transactions.service.ts`
- `dto/create-cash-in.dto.ts` (novo)

---

## ✅ IMPLEMENTADO - Item 2: `CashInFee` (Hardcoded 2.99)

**Diagnóstico Original:** "Taxa hardcoded - Magic Number"

**Realidade do Negócio:** O valor de R$ 2,99 estava chumbado no código ("Magic Number"). Se o Asaas aumentar o preço, seria necessário redeploy.

**Implementação:**
- ✅ `FeeCalculatorService` agora injeta `PrismaService`
- ✅ Método `calculateRechargeSplit()` agora é `async`
- ✅ Busca taxa do banco: `prisma.cashInFee.findFirst()`
- ✅ Fallback mantido (2.99) apenas se banco estiver vazio
- ✅ Hierarquia de prioridade:
  1. Configuração do School (`customFeesConfig`)
  2. Configuração do Plan (`feesConfig`)
  3. **Banco de dados (`CashInFee.pixCustomerFixed`)** ← NOVO
  4. Fallback hardcoded (último recurso)

**Arquivos Modificados:**
- `fee-calculator.service.ts`
- `transactions.service.ts` (3 chamadas atualizadas com `await`)
- `payment.service.ts` (1 chamada atualizada com `await`)

---

## ✅ IMPLEMENTADO - Item 3: `NutritionalProfile` (Validação de Alergias)

**Diagnóstico Original:** "Nunca usado - Remover"

**Realidade do Negócio:** **P1 - CRÍTICO (Bloqueio Nutricional)**. Item da Masterlist: "Testar se o sistema bloqueia venda de produto proibido". Diferencial competitivo vs Vlupt/Nutrebem.

**Implementação:**
- ✅ Integrado ao método `checkRestrictions()` em `OrdersService`
- ✅ Busca `NutritionalProfile` do aluno na transação
- ✅ Validação de **alergias**:
  ```typescript
  if (nutritionalProfile?.allergies?.length > 0) {
    const hasConflict = product.allergens?.some(allergen => 
      userAllergies.includes(allergen)
    );
    if (hasConflict) throw ForbiddenException(...);
  }
  ```
- ✅ Estrutura preparada para **controle de calorias diárias** (comentado, aguardando campo `calories` no Product)
- ✅ Mensagem clara para o usuário: "Restrição Alimentar: X contém ingredientes que podem causar alergia (Y, Z)."

**Arquivos Modificados:**
- `orders.service.ts` - método `checkRestrictions()`

---

## 📋 STATUS DOS ITENS REAVALIADOS

| Item | Status Original | Decisão CTO | Status Atual |
|------|-----------------|-------------|--------------|
| `NutritionalProfile` | 🗑️ Remover | **P1 - Manter** | ✅ Implementado |
| `CashInFee` | 🗑️ Hardcoded | **P0 - Configurável** | ✅ Implementado |
| `transactions/recharge` | 🗑️ Perigoso | **P0 - Recarga Balcão** | ✅ Protegido |
| `DiscountRule` | 🗑️ Código morto | **P2 - Dormant** | 🟡 Manter (não implementar agora) |
| `Coupons` | 🗑️ Não aplicado | **P2 - Dormant** | 🟡 Manter (não implementar agora) |
| `SysConfig` | 🗑️ Nunca usado | **Infra - Manter** | 🟡 Manter (vai precisar para SaaS multi-tenant) |
| `AuditKey` | 🗑️ Nunca usado | **YAGNI - Remover** | 🗑️ Pode remover na Fase 2 |

---

## 📊 MÉTRICAS DAS CORREÇÕES

| Métrica | Valor |
|---------|-------|
| Arquivos Modificados | 6 |
| Novos Arquivos | 1 (DTO) |
| Métodos Criados | 2 (`processCashIn`, DTO) |
| Endpoints Alterados | 1 (renomeado + protegido) |
| Validações Adicionadas | 3 (RLS + Allergias + School Status) |
| Linhas de Código Adicionadas | ~180 |

---

## ⚠️ ITENS QUE CONTINUAM PENDENTES (Próximos Passos)

Os seguintes itens da análise original **ainda não foram implementados** e permanecem críticos:

1. **`InventoryLog` em todas as movimentações** - Estoque sem rastreabilidade completa
2. **Endpoint de cancelamento de pedido** - Gap crítico de negócio
3. **Criptografia de credenciais Asaas** - Segurança
4. **Cálculo de `auditHash`** em transactions - Auditoria imutável
5. **Validação de `School.status`** antes de criar pedido - RLS

**Recomendação:** Estes 5 itens devem ser implementados **ANTES DO PILOTO**.

---

*Update gerado em: 02/02/2026*  
*Status: Correções P0/P1 implementadas conforme reanálise de negócio*
