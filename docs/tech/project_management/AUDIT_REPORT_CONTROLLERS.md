# 🔍 RELATÓRIO DE AUDITORIA DE CONTROLLERS - AMBRA BACKEND

**Data:** 2026-02-06  
**Auditor:** Code Archaeologist + Backend Specialist + Explorer Agent  
**Scope:** 38 Controllers, 3 Frontends (ambra-flow, ambra-console, ambra-food-web)

---

## 🚨 CRÍTICO: Erro 400 no /health

### Diagnóstico
O endpoint `/health` retorna **400 Bad Request** em vez de 200 ou 503.

### Causa Raiz
**O `TenantMiddleware` (linha 140 em `app.module.ts`) é aplicado a TODAS as rotas (`*`)**, incluindo `/health`. Quando o Better Stack ou Railway pinga o endpoint sem um header `x-tenant-slug` válido ou hostname conhecido:

1. `TenantMiddleware` tenta resolver o tenant
2. Se não encontrar, não seta `schoolId` mas continua a requisição
3. `SubscriptionGuard` (APP_GUARD global) verifica se a rota é @Public() ✅ PASSA
4. **Mas** - se a requisição chega com hostname do Railway (e.g., `ambra-server.up.railway.app`), o middleware tenta buscar escola com slug `ambra-server` 
5. **Possível problema:** O `TypeOrmHealthIndicator` do @nestjs/terminus espera uma conexão TypeORM, mas o sistema usa Prisma!

### Código Problemático
```typescript
// health.controller.ts:28-30 - Está injetando TypeOrmHealthIndicator
constructor(
  private health: HealthCheckService,
  private http: HttpHealthIndicator,
  private db: TypeOrmHealthIndicator,  // ❌ NÃO USAMOS TYPEORM! Usamos Prisma
  private memory: MemoryHealthIndicator,
  ...
)
```

### Solução Imediata
**Remover `TypeOrmHealthIndicator`** do constructor - não é usado e pode estar causando erro interno silencioso que resulta em 400.

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| Total de Controllers | 38 |
| Total de Endpoints Mapeados | ~140+ |
| Rotas Públicas (@Public) | 6 |
| Rotas com Autenticação JWT | ~130+ |
| Endpoints Suspeitos (Não Usados) | 23 |
| Mocks/Testes Identificados | 4 |
| Lacunas CRUD Identificadas | 5 |

---

## 🔴 ROTAS ZUMBIS (Não Utilizadas nos Frontends)

**Critério:** Nenhuma referência em `apps/ambra-flow/src`, `apps/ambra-console/src`, ou `apps/ambra-food-web/src`

| Controller | Rota | Método | Suspeita |
|------------|------|--------|----------|
| **auth** | `/auth/recovery/request` | POST | 🔴 NÃO IMPLEMENTADO - Frontend tenta chamar mas endpoint não existe no controller! |
| **users** | `/users/:id/permanent` | DELETE | 🔴 Endpoint de Hard Delete - Não encontrado uso no frontend |
| **users** | `/users/export-csv` | GET | 🔴 Não encontrado uso - existe endpoint financeiro CSV |
| **wallet** | `/wallet/transactions` | GET | 🟡 **DUPLICADO** - `/transactions` existe com mesma funcionalidade |
| **health** | `/health/simulate-fail` | GET | 🔴 Apenas para testes de Discord |
| **health** | `/health/test-sentry` | GET | 🔴 Apenas para testes |
| **tenancy** | `/tenancy/governments/*` | ALL | 🔴 B2G feature - Não encontrado uso no frontend |
| **school-admin** | `/school-admin/reports/daily-sales` | GET | 🟡 Parece incompleto - não usado ativamente |
| **metrics** | `/metrics/revenue` | GET | 🟡 Não encontrado uso específico no frontend |
| **metrics** | `/metrics/top-products` | GET | 🟡 Não encontrado uso específico no frontend |
| **canteen** | `/canteen/:id/menu` | GET/POST | 🟡 Feature Merenda IQ - Uso limitado no frontend |
| **canteen** | `/canteen/pos/student/nfc/:nfcId` | GET | 🟡 Endpoint NFC - Verificar se leitor está ativo |
| **transactions** | `/transactions/admin/cash-in` | POST | 🟢 USADO - Wallet cash-in usa este endpoint |
| **products** | `/products/:id/stock` | PATCH | 🟢 USADO - Via stock-alerts widget |
| **orders** | `/orders/:id/status` | PATCH | 🟢 USADO - Fluxo canteen |
| **wallets** | `/wallets/:walletId/limits` | PATCH | 🟡 Não encontrado uso direto - SOS Merenda config |
| **subscriptions** | `/subscriptions/guardian/*` | ALL | 🟡 Premium feature - Verificar se está ativa |
| **dashboard** | `/dashboard/sales-chart` | GET | 🟡 Existe mas não confirmado uso |
| **payments** | `/payment/pix-recharge` | POST | 🟡 ALIAS - Mesma função de recharge-request |
| **store** | `/store/*` | ALL | 🔴 Não auditado completamente - Verificar uso |
| **stock** | `/stock/*` | ALL | 🟡 Parcialmente mapeado - Verificar integração |
| **fiscal** | `/fiscal/*` | ALL | 🔴 Fiscal module - Verificar uso no frontend |
| **risk** | `/risk/*` | ALL | 🔴 Risk module - Verificar uso no frontend |
| **import** | `/import/*` | ALL | 🔴 Import module - Verificar uso no frontend |
| **communications** | `/communications/*` | ALL | 🟡 Parcialmente usado - announcements |
| **guardian** | `/guardian/*` | ALL | 🟡 Verificar uso no fluxo parental |
| **operators** | `/operators/*` | ALL | 🟡 Verificar uso no gerenciamento de operadores |

### 🔴 Destaque CRÍTICO: Password Recovery NÃO EXISTE!

```typescript
// @c:\Users\Usuário\Documents\AmbraCode\apps\ambra-flow\src\services\auth.service.ts:39-42
requestPasswordRecovery: async (email: string) => {
    const response = await api.post('/auth/recovery/request', { email });  // ❌ 404!
    return response.data;
},
```

**O frontend tem função de "Esqueci minha senha" que chama endpoint INEXISTENTE!**

---

## 🟡 ROTAS MOCKADAS / DADOS HARDCODED

| Controller | Rota | Problema | Severidade |
|------------|------|----------|------------|
| **pos.service.ts (Frontend)** | N/A - Frontend | Retorna mock `OFFLINE_xxx` quando sem internet | ⚠️ Esperado (Offline First) |
| **health** | `/health` | Retorna `{"gemini-api": {"status": "down"}}` se API_KEY ausente | ℹ️ Informativo |

**Não foram encontrados controllers backend retornando dados hardcoded/mockados indevidamente.**

---

## 🟣 LACUNAS CRUD / GAPS IDENTIFICADOS

### 1. 🔴 CRÍTICO: Auth - Password Recovery
- **Gap:** Não existe endpoint para recuperação de senha
- **Onde deveria estar:** `AuthController` - POST `/auth/recovery/request`
- **Impacto:** Usuários não podem recuperar senha esquecida
- **Sugestão:** Implementar fluxo com email de reset

### 2. 🟡 Wallet - Visualização de Dependentes
- **Gap:** Endpoint `/wallet/dependent/:id` não existe para consulta
- **Existe:** Apenas lock/unlock (POST)
- **Impacto:** Responsável não vê saldo dos filhos diretamente
- **Sugestão:** Adicionar GET `/wallet/dependent/:dependentId`

### 3. 🟡 Orders - Falta Paginação
- **Gap:** `GET /orders` não tem paginação implementada
- **Risco:** Performance com muitos pedidos
- **Sugestão:** Adicionar `?page` e `?limit` query params

### 4. 🟡 Products - Bulk Operations
- **Gap:** Não existe endpoint para importar produtos em massa
- **Existe em Users:** `/users/bulk` para importação de alunos
- **Sugestão:** POST `/products/bulk` para CSV import

### 5. 🟡 Notifications - Falta Controller Completo
- **Gap:** `NotificationsController` mapeado mas não auditado
- **Sugestão:** Verificar integração com frontend

---

## 🟢 ROTAS SAUDÁVEIS (Confirmadas em Uso)

| Controller | Endpoints Confirmados | Usado Em |
|------------|----------------------|----------|
| **auth** | `/auth/login`, `/auth/register`, `/auth/profile` | ambra-flow, ambra-console |
| **users** | `/users` (CRUD completo), `/users/bulk`, `/users/stats` | ambra-flow |
| **products** | `/products`, `/products/:id`, `/products/stock-alerts` | ambra-flow (POS, Stock) |
| **orders** | `/orders`, `/orders/:id`, `/orders/:id/cancel` | ambra-flow (POS) |
| **canteen** | `/canteen`, `/canteen/:id`, `/canteen/orders`, `/canteen/orders/:id/deliver` | ambra-flow |
| **wallet** | `/wallet/me`, `/wallet/recharge`, `/wallet/cash-in` | ambra-flow |
| **transactions** | `/transactions`, `/transactions/sync` | ambra-flow |
| **payment** | `/payment/recharge-request` | ambra-flow |
| **tenancy** | `/tenancy/schools` | ambra-console |
| **school-admin** | `/school-admin/dashboard/stats`, `/school-admin/config` | ambra-flow |
| **dashboard** | `/dashboard/metrics`, `/dashboard/stock-alerts` | ambra-flow |
| **asaas** | `/asaas/webhook` | Asaas (Externo) |
| **public-school** | `/public/school/:slug` | Landing pages |

---

## 📋 ANÁLISE POR MÓDULO

### 1️⃣ AUTH MODULE
```
✅ /auth/login (POST) @Public
✅ /auth/register (POST) @Public  
✅ /auth/profile (GET) @JwtAuth
🔴 /auth/recovery/request (POST) - NÃO EXISTE! Frontend chama 404
✅ /auth/change-password (POST) @JwtAuth
```

### 2️⃣ USERS MODULE
```
✅ /users (GET, POST) - Full CRUD
✅ /users/bulk (POST) - Importação CSV
✅ /users/stats (GET) - Dashboard stats
✅ /users/:id (GET, PATCH, DELETE)
✅ /users/:userId/nfc (POST) - Bind NFC
🔴 /users/:id/permanent (DELETE) - Hard delete não usado
🔴 /users/export-csv (GET) - Não encontrado uso
🔴 /users/invitations (POST) - Fluxo parental não confirmado
🔴 /users/dependents (GET) - Fluxo parental não confirmado
```

### 3️⃣ WALLET MODULE
```
✅ /wallet/me (GET) - Consulta própria
✅ /wallet/recharge (POST) - Recarga PIX
✅ /wallet/cash-in (POST) - Recarga balcão
✅ /wallet/dependent/:dependentId/lock (POST)
✅ /wallet/dependent/:dependentId/unlock (POST)
🟡 /wallet/transactions (GET) - POSSIBILMENTE DUPLICADO com /transactions
```

### 4️⃣ ORDERS MODULE
```
✅ /orders (GET, POST) - Listar e criar
✅ /orders/:id (GET) - Detalhes
✅ /orders/:id/status (PATCH) - Atualizar status
✅ /orders/:id/cancel (PATCH) - Cancelar
🟡 Falta paginação em GET /orders
```

### 5️⃣ PRODUCTS MODULE
```
✅ /products (GET, POST) - Full CRUD
✅ /products/:id (GET, PATCH, DELETE)
✅ /products/stock-alerts (GET)
✅ /products/:id/stock (PATCH) - Ajuste rápido
```

### 6️⃣ CANTEEN MODULE
```
✅ /canteen (GET, POST) - CRUD cantinas
✅ /canteen/:id (GET) - Detalhes
✅ /canteen/:id/operators (POST) - Add operador
✅ /canteen/:id/operators/:operatorId (DELETE) - Remover operador
✅ /canteen/orders (GET) - Fila de pedidos
✅ /canteen/orders/:orderId/deliver (POST) - Entregar
🟡 /canteen/pos/student/nfc/:nfcId (GET) - Verificar uso do leitor
🟡 /canteen/pos/students/search (GET) - Busca para POS
🟡 /canteen/:id/menu (GET, POST) - Merenda IQ
```

### 7️⃣ HEALTH MODULE (CRÍTICO!)
```
🔴 /health (GET) @Public - RETORNANDO 400!
🔴 /health/simulate-fail (GET) - Apenas teste
🔴 /health/test-sentry (GET) @Public - Apenas teste
```

---

## 🎯 RECOMENDAÇÕES PRIORITÁRIAS

### P0 - CRÍTICO (Pré-Apresentação)
1. **Corrigir `/health`** - Remover `TypeOrmHealthIndicator` do constructor
2. **Implementar `/auth/recovery/request`** - Ou remover do frontend

### P1 - ALTA PRIORIDADE
3. **Auditar controllers não mapeados:** store, stock, fiscal, risk, import
4. **Verificar duplicação:** `/wallet/transactions` vs `/transactions`
5. **Confirmar uso:** `/tenancy/governments/*` (B2G)

### P2 - MÉDIA PRIORIDADE
6. Adicionar paginação em `GET /orders`
7. Implementar `GET /wallet/dependent/:id` para visualização
8. Adicionar bulk import para produtos

### P3 - BAIXA PRIORIDADE
9. Remover endpoints de teste em produção (simulate-fail, test-sentry)
10. Documentar endpoints não usados para futura remoção

---

## 📊 MAPEAMENTO COMPLETO DE CONTROLLERS

| # | Controller | Prefixo | Rotas | Status |
|---|------------|---------|-------|--------|
| 1 | auth | `/auth` | 5 | ✅ Ativo |
| 2 | users | `/users` | 12 | ✅ Ativo |
| 3 | wallet | `/wallet` | 6 | ✅ Ativo |
| 4 | wallets | `/wallets` | 1 | 🟡 Duplicado? |
| 5 | orders | `/orders` | 5 | ✅ Ativo |
| 6 | products | `/products` | 7 | ✅ Ativo |
| 7 | canteen | `/canteen` | 10 | ✅ Ativo |
| 8 | transactions | `/transactions` | 3 | ✅ Ativo |
| 9 | payment | `/payment` | 3 | ✅ Ativo |
| 10 | school-admin | `/school-admin` | 4 | 🟡 Parcial |
| 11 | tenancy | `/tenancy` | 8 | 🟡 Parcial |
| 12 | public-school | `/public/school` | 1 | ✅ Ativo |
| 13 | dashboard | `/dashboard` | 3 | ✅ Ativo |
| 14 | metrics | `/metrics` | 3 | 🟡 Parcial |
| 15 | health | `/health` | 3 | 🔴 Quebrado |
| 16 | asaas | `/asaas` | 1 | ✅ Ativo |
| 17 | subscriptions | `/subscriptions` | 2 | 🟡 Premium |
| 18 | consent | `/consent` | ? | ❓ Não auditado |
| 19 | announcements | `/announcements` | ? | ❓ Não auditado |
| 20 | guardian | `/guardian` | ? | ❓ Não auditado |
| 21 | operators | `/operators` | ? | ❓ Não auditado |
| 22 | platform | `/platform` | ? | ❓ Não auditado |
| 23 | import | `/import` | ? | ❓ Não auditado |
| 24 | fiscal | `/fiscal` | ? | ❓ Não auditado |
| 25 | risk | `/risk` | ? | ❓ Não auditado |
| 26 | store | `/store` | ? | ❓ Não auditado |
| 27 | stock | `/stock` | ? | ❓ Não auditado |
| 28 | ai | `/ai` | ? | ❓ Não auditado |
| 29 | audit | `/audit` | ? | ❓ Não auditado |
| 30 | notifications | `/notifications` | ? | ❓ Não auditado |
| 31 | invitations | `/invitations` | ? | ❓ Não auditado |
| 32 | tasks | `/tasks` | ? | ❓ Não auditado |
| 33 | communications | `/communications` | ? | ❓ Não auditado |
| 34 | global-admin | `/platform/admin` | ? | ❓ Não auditado |
| 35 | finance | `/platform/finance` | ? | ❓ Não auditado |

---

## 🔧 PRÓXIMOS PASSOS

### Imediato (Pre-Apresentação)
- [ ] Corrigir erro 400 no /health
- [ ] Verificar se password recovery está funcional
- [ ] Confirmar que endpoints críticos (auth, users, orders) respondem 200

### Curto Prazo (1-2 semanas)
- [ ] Completar auditoria dos 18 controllers não mapeados
- [ ] Implementar password recovery ou remover do frontend
- [ ] Documentar endpoints B2G (governments)

### Médio Prazo
- [ ] Refatorar duplicações (wallet/transactions)
- [ ] Adicionar paginação em listagens grandes
- [ ] Remover código morto (endpoints de teste)

---

**FIM DO RELATÓRIO**
