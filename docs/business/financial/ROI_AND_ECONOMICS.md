# ROI & Unit Economics

## Contexto
Este documento define a lógica de monetização e os fundamentos econômicos do Ambra (cash-in, taxa de recarga, premium e SOS Merenda).

---

## Unit Economics (visão simples)

### Definições
- **Cash-in**: entrada de dinheiro na carteira do usuário (ex.: recarga via PIX).
- **Gross (total pago)**: valor efetivamente pago pelo cliente no cash-in.
- **Net (crédito)**: valor que entra como saldo na carteira.
- **Platform fee**: taxa cobrada pela Ambra (receita) quando aplicável.

### Regra de precificação atual
- **Plano Free**
  - **Taxa fixa**: **R$ 2,99** por recarga (cash-in).
  - Objetivo: garantir margem mínima e previsibilidade.
- **Plano Premium**
  - **Taxa**: **R$ 0,00** por recarga.
  - Objetivo: melhorar retenção e justificar assinatura/contrato premium.

### Estrutura do cash-in (Free)
- Cliente paga: **R$ (valor_recarga + 2,99)**
- Carteira recebe crédito: **R$ valor_recarga**
- Receita Ambra (platform fee): **R$ 2,99**

### Estrutura do cash-in (Premium)
- Cliente paga: **R$ valor_recarga**
- Carteira recebe crédito: **R$ valor_recarga**
- Receita Ambra (platform fee): **R$ 0,00**

---

## Regras de Refund (política)

### Regra principal
- **Não reembolsar a taxa de serviço (R$ 2,99)**.

### Justificativa
- A taxa de serviço é a contrapartida pelo processamento/infra/risco operacional.
- Mesmo que a recarga seja estornada/cancelada por motivos operacionais, o custo do fluxo já ocorreu (processamento, conciliação, antifraude, suporte).

### Comportamento esperado
- Em caso de devolução do valor de recarga:
  - **Estornar apenas o crédito (net)**.
  - **Manter a taxa (platform fee)**.

> Exceções (opcionais, por política comercial) devem ser explicitadas em `docs/business/legal`.

---

## Lógica de Cash-In (regras do produto)

### Objetivo
Garantir que o cash-in:
- Seja previsível para o usuário.
- Seja financeiramente sustentável.
- Seja auditável (gross/net/fee persistidos no ledger).

### Invariantes
- **gross >= net**
- **platformFee >= 0**
- Para Free: **platformFee = 2,99 (fallback hard)**
- Para Premium: **platformFee = 0,00**

---

## Monetização do SOS Merenda

### Problema que resolve
Em dias de baixa liquidez familiar, o aluno pode ficar sem alimentação. O SOS Merenda cria um mecanismo de limite/adiantamento controlado.

### Como monetiza (modelos possíveis)
- **B2B (escola/município)**: cobrar por aluno/mês para habilitar limites e relatórios.
- **B2C (responsável)**:
  - Upsell para Premium (zero taxa de recarga + recursos)
  - Cobrança de taxa de conveniência em cash-in (já coberta pelo Free)

### Regras de risco (essenciais)
- Limites configuráveis:
  - `overdraftLimit` (limite de adiantamento)
  - `dailySpendLimit` (teto diário)
- Bloqueio de dívida:
  - `isDebtBlocked` deve ser reavaliado quando limites mudam.

---

## Observabilidade mínima (o que deve ser rastreado)
- Número de recargas/dia por escola.
- Ticket médio de recarga.
- Receita por taxa (platform fee) por período.
- % de usuários premium vs free.
- Ativações de SOS Merenda e utilização do overdraft.
