# Refund Engine — Spec (Planned)

## Objetivo
Implementar um motor de reembolso que:
- Atenda ao CDC (direito de arrependimento até 7 dias).
- Proteja o caixa (Ambra e Escola) contra sangria e fraude.
- Garanta auditabilidade bancária (ledger).

---

## Conceitos

### Ledger como fonte de verdade
A transação original de recarga deve registrar:
- `grossAmount`: total pago (crédito + taxa)
- `netAmount`: crédito efetivo na carteira
- `platformFee`: receita Ambra

### Refund Lock
Ao solicitar reembolso, o sistema **congela** (debita) imediatamente o saldo reembolsável na carteira, impedindo gasto durante processamento.

### Saldo fungível
Não é permitido reembolsar valor já consumido.
- `RefundableAmount = min(originalTx.netAmount, wallet.balance)`
- Se for menor que `originalTx.netAmount`, o reembolso é parcial (parte já virou consumo).

### Proteção de caixa da escola (WAITING_FUNDS)
Se a subconta/conta segregada não tiver liquidez suficiente, o pedido entra em `WAITING_FUNDS` e deve haver:
- notificação para gestão
- opção de cancelamento/TTL (ex.: 48h) para devolver o lock ao aluno

---

## Política (decisão aprovada)
- **Opção (B):** Se CDC (<= 7 dias) e saldo intacto, devolve taxa também.

Regras:
1. Base de reembolso é sempre o **saldo reembolsável** (fungibilidade).
2. Devolução da taxa só ocorre se:
   - `daysSince <= 7`
   - e `RefundableAmount == originalTx.netAmount` (saldo intacto)

---

## Modelagem (Prisma)

### Enum
Adicionar `REFUND_LOCK` ao `TransactionType`.

### Modelo
Criar `RefundRequest` com:
- vínculo com `walletId` e `transactionId`
- `amount` (valor final do PIX ao pai)
- `feeReversed` (se taxa foi devolvida)
- `pixKey`, `pixKeyType`
- `status`: `PENDING | WAITING_FUNDS | COMPLETED | REJECTED | CANCELLED`
- `failureReason` opcional

---

## API

### `POST /payment/refund-request`
Entrada:
- `transactionId`
- `pixKey`
- `pixKeyType`

Saída:
- `refundRequestId`
- `amount`
- `status`

Comportamento:
- Executa `Refund Lock` dentro de transação serializable.
- Cria `RefundRequest`.

---

## Worker (RefundProcessor)
- Frequência: 1 min (ou evento)
- Fluxo:
  1. Verificar liquidez (Asaas balance)
  2. Se suficiente: transferir, marcar `COMPLETED`, criar `Transaction REFUND`
  3. Se insuficiente: marcar `WAITING_FUNDS` e notificar

---

## Critérios de aceite (MVP)
- Não é possível pedir reembolso maior que o saldo reembolsável.
- Reembolso dentro de 7 dias devolve taxa **apenas** se saldo intacto.
- Reembolso não trava a fila e não permite double spending.
- Trilhas de auditoria e ledger consistentes.
