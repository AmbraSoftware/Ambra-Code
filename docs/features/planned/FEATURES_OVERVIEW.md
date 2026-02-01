# Features Overview — Planned (MVP)

Este documento consolida as **features planejadas** (backlog) do Ambra Ecosystem.

## Regra de operação (importante)
- Quando uma feature for implementada, **mova a seção correspondente** (ou o arquivo dedicado) de `docs/features/planned/` para `docs/features/implemented/`.
- Features simples podem ficar agrupadas aqui.
- Features complexas devem ter um arquivo próprio (ex.: Refund Engine).

---

## Operação (PDV / Guerra da Fila)

### Lookup NFC < 200ms
- **Objetivo:** Identificar aluno por NFC com latência baixa.
- **Status:** Planned (validar em piloto e garantir p95).

### Fallback de Busca Híbrida (Nome + Foto)
- **Objetivo:** Contingência quando NFC falha.
- **Requisito:** UI deve exibir **foto (avatar)** + identificação (turma/série) para evitar venda para o aluno errado.
- **Status:** Planned (backend implementado; frontend precisa validar exibição).

### Modo Offline (Contingência)
- **Objetivo:** não parar a fila quando rede cair.
- **Abordagem MVP:** cache local + fila de sincronização.
- **Status:** Planned (validar limites e riscos de double spending).

---

## Wallet / Fintech

### Cash-In de Balcão (Recarga de Balcão)
- **Objetivo:** digitalizar dinheiro físico no caixa para resolver pagamento misto e troco.
- **API:** `POST /wallet/cash-in`
- **Status:** Planned (documentar UI e validar operação em piloto).

### Recarga PIX (cash-in)
- **Objetivo:** recarga via PIX com split (gross/net/platformFee) e auditoria.
- **Status:** Planned (estabilizar Asaas e produção).

### Taxa de Recarga (Free vs Premium)
- **Free:** taxa fixa R$ 2,99.
- **Premium:** taxa 0.
- **Status:** Planned (garantir consistência em backend + UI).

---

## SOS Merenda (Crédito controlado)

### Overdraft Limit + Daily Spend Limit
- **Objetivo:** permitir saldo negativo controlado + limites diários.
- **Admin:** endpoint de gestão de limites (somente admin).
- **Status:** Planned (validar guard/roles e UX de ativação).

---

## Estoque

### Concorrência de estoque com Reservas Ativas
- **Objetivo:** impedir venda do item reservado digitalmente.
- **Regra:** `disponível = stock - reservas_ativas`.
- **Status:** Planned (hardening: evitar bypass por compras diretas sem order).

---

## Fiscal / Compliance

### Fiscal Pending Queue (MVP)
- **Objetivo:** registrar itens fiscais em `FiscalPendingItem` mesmo com emissão desligada.
- **Saída MVP:** export CSV para contabilidade.
- **Status:** Planned (confirmar que checkout grava fiscal pending item).

---

## Reembolsos

### Refund Engine (Motor de Reembolso)
- **Objetivo:** CDC + proteção de caixa (Refund Lock, fungibilidade de saldo, waiting funds).
- **Documento:** `docs/features/planned/REFUND_ENGINE.md`
- **Status:** Planned.
