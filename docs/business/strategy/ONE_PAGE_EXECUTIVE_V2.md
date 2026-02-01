# One Page Executivo: Ambra Ecosystem v2.0

**De:** Diretor de Estratégia (CSO), Ambra Ecosystem  
**Para:** Stakeholders e Parceiros Estratégicos  
**Assunto:** Posicionamento Estratégico e Status do MVP v2.0

---

## 1. O Problema: A Dor Real do Ecossistema Escolar

O ambiente escolar moderno enfrenta atrito operacional e financeiro sistêmico. A desconexão entre necessidades de pais, escolas e cantinas gera um ciclo de ineficiência, perda de receita e insegurança.

- **Fila e perda de receita na cantina**
  - Filas longas, erros de troco e “fiado” informal.
  - Cada segundo perdido na fila = transações perdidas.

- **Insegurança e falta de controle parental**
  - Dinheiro em espécie é vulnerável.
  - Falta de transparência gera ansiedade e limita controle de hábitos.

- **Ausência de governança e compliance**
  - Conciliação manual.
  - Complexidade fiscal (NFC-e).
  - Falta de dados consolidados impede crescimento.

---

## 2. A Solução Ambra: O Ecossistema Híbrido

A Ambra opera como **Fintech Híbrida + ERP Escolar**:

- **Checkout de alta performance (B2B)**
  - **NFC híbrido** com lookup < 200ms.
  - **Fallback visual** (nome + foto) para contingência.
  - **Modo offline** (cache + sync) para resiliência.

- **Integridade financeira (B2C + governança)**
  - Ledger bancário inviolável.
  - Registro imutável de `grossAmount`, `platformFee`, `netAmount`.

---

## 3. Modelo de Negócio & Unit Economics

- **Receita B2C (Taxa de conveniência)**
  - Plano Free: taxa fixa **R$ 2,99** por recarga.

- **Receita recorrente (Assinatura Premium)**
  - Mensalidade (ex.: R$ 9,90) com taxa de recarga **R$ 0,00**.
  - Aumenta LTV e previsibilidade (MRR).

- **Monetização de risco (SOS Merenda)**
  - Overdraft controlado (`overdraftLimit`).
  - Bloqueios automáticos (`isDebtBlocked`).
  - Driver de conversão Free -> Premium.

---

## 4. Funcionalidades de "Guerra" (Diferenciais Competitivos)

- **Cash-In de Balcão**
  - Digitaliza dinheiro físico no caixa.
  - Elimina troco e resolve pagamento misto.

- **Refund Engine (Motor de Reembolso Inteligente)**
  - Refund Lock + saldo fungível.
  - CDC (7 dias) com regras auditáveis.
  - Proteção de caixa via `WAITING_FUNDS`.

- **Controle nutricional efetivo**
  - Bloqueio real por categoria/produto.

---

## 5. Status & Tração

- **MVP Backend validado**
  - Núcleo financeiro e regras de negócio estruturados.
  - Metas de performance prontas para validação em piloto.

- **Compliance e segurança**
  - Estrutura fiscal MVP via `FiscalPendingItem` + CSV.
  - LGPD: uso de `avatarUrl` em vez de arquivo de imagem.

- **Pronto para piloto**
  - Próxima etapa é validação real em escolas privadas.
  - Coletar métricas de adoção e throughput.
