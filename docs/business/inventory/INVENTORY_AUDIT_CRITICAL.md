# AUDITORIA - Módulo de Estoque & Estoque Fantasma

**Data:** 02/02/2026  
**Versão do Sistema:** v3.8.5 (RIZO & AMBRA)  
**Auditor:** Backend Specialist / Code Archaeologist  
**Status:** 🔴 **CRÍTICO - Requer Ação Imediata**

---

## 1. RESUMO EXECUTIVO

O módulo de estoque possui **3 falhas críticas** que podem causar:
- Venda de produtos sem stock (overselling)
- Perda de estoque (baixa dupla)
- Acúmulo de dados fantasma (limbo)

**Recomendação:** Não usar em produção até correção.

---

## 2. ARQUITETURA ATUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE ESTOQUE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CHECKOUT (reserveProductsInTransaction)                     │
│     ├── Cria StockReservation (status: ACTIVE)                  │
│     ├── Expira em: 15 minutos                                   │
│     └── Valida: stock - reservas ACTIVE >= quantidade           │
│                                                                 │
│  2. PAGAMENTO (confirmSaleInTransaction)                        │
│     ├── Atualiza reservas para COMPLETED                        │
│     └── Decrementa stock físico                                 │
│                                                                 │
│  3. ENTREGA (finalizeOrderDeliveryInTransaction)                │
│     └── Decrementa stock físico (NOVAMENTE!)                    │
│                                                                 │
│  4. LIMPEZA CRON (handleExpiredStockReservations)               │
│     └── Marca reservas expiradas como EXPIRED                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. FALHAS CRÍTICAS

### 🚨 FALHA 1: Race Condition na Confirmação de Venda

**Local:** `stock.service.ts:240-243`

```typescript
await tx.stockReservation.updateMany({
  where: { 
    productId: { in: productIds }, 
    status: 'ACTIVE' 
  },  // ← BUG: Não filtra por orderId!
  data: { status: 'COMPLETED' },
});
```

**Problema:**
- Cliente A reserva produto X (orderId: A)
- Cliente B reserva produto X (orderId: B)
- Cliente B paga primeiro
- O código de B completa a reserva de A também!

**Impacto:**
- Pedido A "rouba" stock do pedido B
- Inconsistência de estoque
- Possível overselling

**Solução:**
```typescript
// Adicionar vinculação orderId na StockReservation
await tx.stockReservation.updateMany({
  where: { 
    productId: { in: productIds },
    orderId: orderId,  // ← NOVO CAMPO NECESSÁRIO
    status: 'ACTIVE' 
  },
  data: { status: 'COMPLETED' },
});
```

---

### 🚨 FALHA 2: Dupla Baixa de Estoque

**Locais:** 
- `stock.service.ts:246-279` (confirmSaleInTransaction)
- `stock.service.ts:212-224` (finalizeOrderDeliveryInTransaction)

**Problema:**
```typescript
// confirmSaleInTransaction já decrementa:
await this.decrementAndLog(tx, productId, qty, canteenId, orderId);

// finalizeOrderDeliveryInTransaction decrementa NOVAMENTE:
await this.decrementAndLog(tx, productId, qty, canteenId, orderId);
```

**Impacto:**
- Cada venda reduz 2x o estoque
- Stock negativo silencioso
- Prejuízo financeiro

**Solução:**
Opção A - Remover de finalizeOrderDeliveryInTransaction:
```typescript
async finalizeOrderDeliveryInTransaction(...) {
  // APENAS cancelar a reserva, não decrementar
  await tx.stockReservation.updateMany({
    where: { orderId, status: 'COMPLETED' },
    data: { status: 'DELIVERED' }
  });
}
```

Opção B - Verificar se já foi decrementado:
```typescript
// Adicionar flag na Order
if (!order.stockDecremented) {
  await decrementAndLog(...);
  await tx.order.update({ where: { id: orderId }, data: { stockDecremented: true }});
}
```

---

### 🚨 FALHA 3: Estoque Fantasma (Limbo)

**Local:** `tasks.service.ts:23-69` + `stock.service.ts:141`

**Problema:**
1. Reserva criada com expiração de 15 minutos
2. Job marca como EXPIRED a cada 5 minutos
3. Mas não há:
   - Reconciliação de estoque
   - Limpeza física das reservas antigas
   - Verificação de integridade

**Impacto:**
- Tabela `stock_reservations` cresce indefinidamente
- Queries ficam lentas
- Cálculo de estoque disponível pode falhar em volume

**Métrica de Risco:**
```sql
-- Estimativa de crescimento
-- 1000 pedidos/dia × 30 dias = 30k reservas/mês
-- Em 1 ano: 360k registros na tabela
```

**Solução:**
```typescript
// 1. Hard Delete após período seguro
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async cleanupOldReservations() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await this.prisma.stockReservation.deleteMany({
    where: {
      status: { in: ['COMPLETED', 'EXPIRED', 'CANCELLED'] },
      updatedAt: { lt: thirtyDaysAgo }
    }
  });
}

// 2. Reconciliação periódica
@Cron(CronExpression.EVERY_HOUR)
async reconcileStock() {
  // Verificar se stock real = stock esperado
  // Alertar discrepâncias
}
```

---

## 4. SCHEMA ATUAL

```prisma
model StockReservation {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productId String   @db.Uuid
  canteenId String   @db.Uuid
  quantity  Int
  reason    String   @default("CHECKOUT")
  status    String   @default("ACTIVE")  // ACTIVE | COMPLETED | EXPIRED
  expiresAt DateTime @db.Timestamptz(3)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  
  // FALTANDO:
  // orderId   String?  @db.Uuid  ← CRÍTICO para vinculação
  // updatedAt DateTime @updatedAt ← Para limpeza eficiente
}
```

---

## 5. CENÁRIOS DE FALHA

### Cenário 1: Overselling por Race Condition
```
1. Stock: 1 unidade
2. Cliente A inicia checkout (reserva: 1)
3. Cliente B inicia checkout (reserva: 1) ← Erro! Deveria falhar
4. Cliente B paga (confirma TODAS as reservas)
5. Cliente A tenta pagar ← Estoque já foi decrementado 2x
6. Resultado: Stock = -1
```

### Cenário 2: Perda de Estoque
```
1. Pedido criado com reserva
2. Pagamento confirmado (stock -1)
3. Pedido entregue (stock -1 novamente)
4. Resultado: Stock = -2 para 1 venda
```

### Cenário 3: Limbo de Estoque
```
1. Cliente abandona checkout após reserva
2. Reserva expira em 15 min
3. Marca como EXPIRED
4. Registro permanece no banco para sempre
5. Após 1 ano: Milhões de registros fantasmas
```

---

## 6. RECOMENDAÇÕES

### Imediato (Bloqueante para Produção)

1. **Adicionar orderId à StockReservation**
   ```prisma
   model StockReservation {
     ...
     orderId   String?  @db.Uuid
     order     Order?   @relation(fields: [orderId], references: [id])
     ...
   }
   ```

2. **Corrigir confirmSaleInTransaction**
   - Filtrar por orderId
   - Ou remover decremento e deixar apenas em finalizeOrderDelivery

3. **Remover dupla baixa**
   - Escolher UM ponto de decremento (recomendado: pagamento)

### Médio Prazo

4. **Implementar Hard Delete** de reservas antigas
5. **Adicionar reconciliação periódica**
6. **Métricas de observabilidade**
   - Taxa de conversão de reservas
   - Tempo médio de expiração
   - Discrepâncias de estoque

### Longo Prazo

7. **Sistema de Bloqueio Otimista** aprimorado
8. **Cache de estoque disponível** (Redis)
9. **Fila de eventos de estoque** para auditoria

---

## 7. CHECKLIST DE CORREÇÃO

- [ ] Migration: Adicionar orderId em StockReservation
- [ ] Fix: Atualizar reserveProductsInTransaction para vincular orderId
- [ ] Fix: Corrigir confirmSaleInTransaction para filtrar por orderId
- [ ] Fix: Remover decremento duplicado (escolher um fluxo)
- [ ] Feature: Implementar hard delete de reservas antigas
- [ ] Feature: Implementar reconciliação periódica
- [ ] Test: Criar testes de integração para race conditions
- [ ] Test: Simular carga e verificar integridade do estoque
- [ ] Doc: Atualizar diagramas de sequência

---

## 8. REFERÊNCIAS

- `apps/backend/src/modules/stock/stock.service.ts`
- `apps/backend/src/modules/tasks/tasks.service.ts`
- `apps/backend/src/modules/orders/orders.service.ts`
- `apps/backend/prisma/schema.prisma` (StockReservation)

---

*Gerado em: 02/02/2026*  
*Próxima revisão: Após correções*
