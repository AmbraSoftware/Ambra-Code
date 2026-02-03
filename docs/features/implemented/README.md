# Features — Implemented

Esta pasta contém documentação de funcionalidades **já implementadas** e consideradas prontas para uso/produção.

Use para:
- Resumos de implementação
- Rotas/endpoints e contratos
- Regras de negócio já vigentes

---

## Funcionalidades Financeiras (Asaas Integration)

### ✅ B2B SaaS Billing
- **Subcontas White Label:** Criação automática no onboarding
- **Assinaturas Recorrentes:** BOLETO para escolas
- **Reajuste de Preço:** Sincronização automática Asaas
- **Webhooks:** PAYMENT_CONFIRMED, ACCOUNT_STATUS_CHANGED

### ✅ B2C Wallet Operations
- **PIX com Split:** Recarga direta para carteira do aluno
- **Cálculo de Taxas:** Plano Free (R$2.99) vs Premium (R$0)
- **Cash-in de Balcão:** Recarga presencial por operador
- **Ledger Imutável:** Transações com gross/net/fee

### ⚠️ B2C Subscriptions (Gap Identificado)
- **Status:** Mock implementado, integração Asaas pendente
- **Impacto:** Usuários Premium ativados sem cobrança real
- **Arquivo:** `subscriptions.controller.ts`
- **Referência:** Ver `/docs/business/financial/ASAAS_INTEGRATION_AUDIT.md`

---

*Última atualização: 02/02/2026*
