# One Page Executive (Ambra)

## Visão
Simplificar e acelerar o consumo na cantina escolar, garantindo controle financeiro e segurança para famílias e escolas.

---

## Problema
- Filas longas e lentidão no pagamento na cantina.
- Dor operacional para a escola (controle, conciliação, inadimplência).
- Dor para responsáveis/alunos (saldo, recarga, bloqueios, perda de tempo).

---

## Solução
- **Pagamento por NFC** (aluno aproxima e paga).
- **Consulta de aluno < 200ms** no POS (experiência instantânea).
- **Recarga via PIX** integrada.
- **Regras de limite (SOS Merenda)** para evitar aluno sem alimentação.

---

## Como funciona (Happy Path)
1. Operador busca aluno por NFC.
2. Sistema valida escola/tenant e retorna dados mínimos.
3. Compra é autorizada/registrada na carteira.
4. Se necessário, responsável faz recarga PIX.

---

## Diferenciais
- **Offline mode (direção)**: capacidade de operar com degradação controlada em conectividade ruim.
- **Segurança multi-tenant (RLS)**: isolamento por escola.
- **Auditoria**: ações críticas registradas.
- **Economia previsível**: taxa fixa no Free e zero no Premium.

---

## Modelo de negócio (resumo)
- **Free**: taxa fixa de recarga (R$ 2,99) para sustentar operação.
- **Premium**: zero taxa de recarga + pacote de benefícios/contrato.
- **SOS Merenda**: habilitado por política/contrato (B2B) ou via upsell (B2C).

---

## Status
- **MVP pronto** (fluxos principais implementados).
- Backend preparado para:
  - NFC lookup seguro
  - Busca otimizada de alunos
  - Fee hardening (2,99 no Free; 0 no Premium)
  - Auditoria e limites de carteira

---

## Próximos passos (curto prazo)
- Estabilizar integração PIX (Asaas) e validação de credenciais.
- Fechar regras legais/compliance (CDC, termos, política de refund).
- Finalizar offline mode (se confirmado como MUST).
