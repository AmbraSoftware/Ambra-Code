# Documento Oficial de Regras de Negócio (BRD) e Relatório Financeiro — v2.0

## 1. Resumo Executivo e Proposta de Valor

Nossa estratégia posiciona o Ambra Ecosystem no mercado de tecnologia educacional como uma plataforma integrada, que combina serviços financeiros e operacionais para o ambiente escolar.

A adoção de um modelo de negócios híbrido não é apenas uma estratégia de diversificação, mas um *moat* competitivo. Este modelo funciona como um **flywheel**:
- O pilar **SaaS (B2B)** fornece infraestrutura de gestão que garante adesão e retenção das escolas.
- Essa base cria uma audiência cativa para os serviços de alta margem da vertical **Fintech (B2C)**.

O Ambra é, por definição, um **Ecossistema Híbrido**, fundamentado em dois pilares sinérgicos:

### 1.1 Fintech B2C (Pais e Alunos)
- Carteira digital pré-paga.
- Monetização principal no fluxo de recargas (cash-in) via PIX.
- Aplicação de taxa de conveniência transparente.

### 1.2 SaaS ERP B2B (Escolas e Cantinas)
- Plataforma SaaS por assinatura recorrente.
- PDV, gestão de catálogo, controle de estoque e relatórios de governança.

Dois diferenciais sustentam a proposta e explicam o “porquê técnico”:

### Diferencial Operacional — "A Guerra da Fila"
- Objetivo de performance: **lookup de aluno por NFC < 200ms**.
- Elimina filas e aumenta throughput (vendas por minuto).

### Diferencial Financeiro — "Governança Financeira"
A confiança e auditabilidade residem no Ledger Bancário proprietário (modelo `Transaction`).
- `grossAmount`: valor total pago pelo pai.
- `netAmount`: valor líquido creditado ao aluno.
- `platformFee`: receita da Ambra.

Esses campos são entradas contábeis imutáveis e constituem **single source of truth**.

---

## 2. Unit Economics e Modelo de Receita (Hardening do ROI)

A premissa fundamental é que Unit Economics robusto é pré-requisito não negociável para crescimento escalável.

### 2.1 Política de preços

#### Plano Free
- Taxa de conveniência fixa e imutável: **R$ 2,99 por recarga**.
- Objetivo: cobrir custos do gateway (Asaas) + impostos e garantir margem positiva por operação.

#### Plano Premium
- Taxa de conveniência: **R$ 0,00**.
- Monetização via assinatura mensal (MRR previsível), aumentando LTV.

### 2.2 P&L unitário (plano Free)

| Componente | Valor Unitário |
| :--- | ---: |
| (+) Receita Bruta (Taxa) | R$ 2,99 |
| (-) Custo Gateway (Asaas) | R$ 1,99 |
| (-) Impostos (Estimado) | R$ 0,18 |
| (=) Margem de Contribuição | R$ 0,82 |

---

## 3. Regras Operacionais: A "Guerra da Fila"

A excelência operacional no PDV é o ponto único de falha ou sucesso para a adoção B2B.

### 3.1 Checkout híbrido

1. **Fluxo Prioritário (NFC USB)**
- Leitura por NFC + identificação do aluno.
- Meta de latência: < 200ms.

2. **Fluxo de Contingência (Busca Manual)**
- Busca por nome.
- Exibição obrigatória de:
  - Foto (avatar)
  - Identificação do aluno (turma/série)

### 3.2 Resiliência offline
- Em caso de falha de conectividade, o caixa não pode parar.
- Frontend deve utilizar cache local para operação e sincronizar posteriormente.

### 3.3 Cash-In de Balcão
- Digitaliza dinheiro físico no caixa via recarga instantânea na wallet do aluno.
- Resolve pagamento misto e elimina troco.

### 3.4 Concorrência de estoque (Reservas Ativas)
- Disponível = Stock Total - Reservas Ativas (`StockReservation`).
- Evita venda dupla do “último item”.

---

## 4. Motor de Reembolso e Segurança (Refund Engine)

Componente estratégico que equilibra:
- conformidade legal (CDC)
- proteção de caixa
- prevenção de fraude

### 4.1 Regras CDC

#### Até 7 dias (Direito de arrependimento)
- Devolução corresponde ao `grossAmount` **somente quando aplicável e possível**.
- A taxa (`platformFee`) pode ser devolvida apenas no cenário de saldo intacto (ver "saldo fungível").

#### Após 7 dias (Resgate de saldo)
- Cash-out do saldo não utilizado.
- Retém taxa de serviço (platformFee) como remuneração do cash-in já processado.

### 4.2 Mecanismos de segurança
1. **Refund Lock**: congela saldo ao solicitar reembolso.
2. **Saldo fungível**: não devolve valor já consumido.
3. **Proteção de caixa**: `WAITING_FUNDS` se escola não tiver liquidez.

---

## 5. Compliance, Fiscal e LGPD

### 5.1 Estratégia fiscal

#### MVP
- Registrar transações fiscalizáveis na tabela `FiscalPendingItem`.
- Exportar CSV para contabilidade.

#### Visão futura
- Integração com API assíncrona de emissão fiscal (NFC-e/nota).

### 5.2 LGPD e dados de menores
- Não armazenar imagem (arquivo) de avatar.
- Armazenar apenas `avatarUrl` (revogável), reduzindo superfície de risco.

### 5.3 Cláusula pétrea (Termos)
"A Ambra é intermediadora de pagamentos. A recarga transfere valores diretamente ao Estabelecimento Escolar. Solicitações de reembolso de saldo não utilizado devem ser direcionadas à Escola, sujeitas às políticas de cancelamento da mesma. A Taxa de Serviço remunera a transação financeira de cash-in e não é reembolsável após o prazo legal de arrependimento, uma vez que o serviço de processamento do pagamento foi integralmente prestado."
