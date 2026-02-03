# Product Improvements Roadmap - Financial & Asaas

**Versão:** 1.0  
**Data:** 02/02/2026  
**Status:** Draft para Review

---

## 🎯 Visão Estratégica

Maximizar a eficiência da integração Asaas para:
1. **Aumentar conversão** (múltiplos métodos de pagamento)
2. **Reduzir churn** (auto-retry, notificações)
3. **Automatizar operações** (transferências, reconciliação)

---

## Phase 1: Correções Críticas (Sprint 1) - 2 semanas

### P0 - B2C Subscription Real
**Problema:** Guardian Premium é ativado sem cobrança real
**Implementação:**
```typescript
// subscriptions.controller.ts
const asaasSub = await asaasService.createSubscription({
  customer: guardianCustomerId,
  billingType: 'PIX', // ou CREDIT_CARD
  value: plan.price,
  cycle: 'MONTHLY',
  description: 'Ambra Food Premium'
});
// Salvar asaasSub.id no user.asaasSubscriptionId
```
**Webhook:** Adicionar handler SUBSCRIPTION_PAID

### P1 - Credit Card para Recargas
**Condição:** Recargas > R$100 oferecer opção de cartão
**Benefício:** Aumentar ticket médio, reduzir abandono

---

## Phase 2: Otimização (Sprint 2-3) - 4 semanas

### P2 - Carnês/Parcelamento
**Casos de uso:**
- Recargas > R$200 em 3x
- Mensalidades escolares
**Endpoint:** `/payments` com `installmentCount`

### P3 - Auto-Retry Inteligente
**Regra:** Falha no cartão → retry em D+1, D+3
**Notificação:** Push/email antes de cancelar

---

## Phase 3: Automação Avançada (Sprint 4-6) - 6 semanas

### P4 - Transferências Automáticas
**Fluxo:**
```
Saldo Operador > R$500 → Transfer automática (diária)
Saldo Operador > R$2000 → Transfer imediata
```
**API:** POST `/transfers`

### P5 - Antecipação de Recebíveis
**Oportunidade:** Operadores podem antecipar saldo
**Receita:** Spread de antecipação para Ambra

---

## 📊 KPIs de Sucesso

| Métrica | Baseline | Target |
|---------|----------|--------|
| Conversão Premium | 0% (mock) | 15% |
| Taxa de churn B2B | ? | <5%/mês |
| Ticket médio recarga | R$35 | R$50 |
| Taxa de chargeback | ? | <1% |

---

## 🔧 Recursos Asaas Não Explorados

1. **Split transacionável** - Split em múltiplas carteiras
2. **Pix Cobrança** - QR Code dinâmico por transação
3. **Notificações push Asaas** - Menos dependência nossa
4. **Relatórios consolidados** - Conciliação automática
5. **Link de pagamento** - Compartilhável via WhatsApp

---

**Próximo passo:** Priorização no backlog do produto
