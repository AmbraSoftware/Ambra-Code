# Plano de Reestruturação Arquitetural: ROI Ambra Flow & Food

Este plano detalha as mudanças necessárias para suportar o novo modelo de negócio, focando em **flexibilidade total** de preços por escola/governo e na introdução do plano Premium para pais.

## 1. Arquitetura de Dados (Schema)

A principal mudança é mover a configuração de taxas de "variáveis globais/hardcoded" para uma estrutura hierárquica e configurável no banco de dados.

### A. Hierarquia de Configuração de Taxas (Fee Configuration)
Implementaremos um sistema de **"Cascata de Configuração"**, onde a taxa específica tem prioridade sobre a genérica:
1.  **Nível Escola (Maior Prioridade):** Configuração específica negociada com aquela escola/governo.
2.  **Nível Plano (Média Prioridade):** Configuração padrão do plano (ex: "Escola Pública", "Escola Privada Gold").
3.  **Nível Global (Menor Prioridade):** Fallback do sistema.

### B. Mudanças no Prisma Schema

```prisma
// 1. Novos Tipos de Plano
enum PlanTarget {
  SCHOOL_SAAS       // Planos para Gestores (B2B)
  GUARDIAN_PREMIUM  // Planos para Pais (B2C) - Ambra Food Premium
}

// 2. Modelo de Plano Enriquecido
model Plan {
  id          String     @id @default(uuid())
  name        String     // Ex: "Premium Familiar", "Gestor Gold"
  target      PlanTarget
  price       Decimal    // Mensalidade (ex: 15.99 ou 150.00)
  
  // JSON Flexível para todas as taxas (Recarga, Transação, Risco)
  // Permite mudar a estratégia sem migração de banco
  feesConfig  Json?      
  // Exemplo de JSON:
  // {
  //   "manager": { "rechargeFixed": 3.00, "rechargePercent": 5.0, "transactionPercent": 4.0 },
  //   "guardian": { "rechargeFixed": 2.00, "riskFixed": 2.00 }
  // }

  // ... outros campos existentes
}

// 3. Flexibilidade por Escola
model School {
  // ... campos existentes
  
  // Override específico para contratos de governo ou negociações especiais
  // Se preenchido, ignora as taxas do Plan
  customFeesConfig Json? 
}

// 4. Assinatura do Pai (B2C)
model User {
  // ...
  subscriptionPlanId String? // Link para o plano Premium
  subscriptionStatus String? // ACTIVE, INACTIVE
}
```

## 2. Lógica Financeira (Backend)

### A. Novo Serviço: `FeeCalculatorService`
Centralizará toda a matemática financeira, removendo lógica hardcoded do `TransactionSplitter`.

*   **Entrada:** `(Valor Recarga, EscolaID, UserID)`
*   **Lógica Inteligente:**
    1.  **Check Premium:** Verifica se o `User` tem plano `GUARDIAN_PREMIUM` ativo. Se sim, zera as taxas do responsável (Isenção R$ 2,00 + Risco).
    2.  **Resolução de Taxas:** Busca `School.customFeesConfig` ?? `School.Plan.feesConfig`.
    3.  **Cálculo Composto:**
        *   *Taxa Gestor:* `(Valor * 5%) + R$ 3,00`
        *   *Taxa Risco (se aplicável):* `(Valor * 4%) + R$ 1,00`
    4.  **Split Final:** Retorna o objeto exato para o Gateway (Asaas).

### B. Tratamento da "Taxa por Transação (4%)"
Como o dinheiro entra via Recarga (Split antecipado), a taxa de 4% sobre o consumo (venda futura) será tratada via **Retenção Antecipada Inteligente** ou **Billing Mensal**, dependendo da preferência de fluxo de caixa da escola.
*   *Recomendação:* Incluir os 4% no cálculo do split da recarga (totalizando retenção de ~9%), garantindo que o saldo que chega ao operador já é líquido de todas as obrigações operacionais.

## 3. Implementação em Lote (Roadmap)

1.  **Database Migration:** Criar os campos `feesConfig`, `customFeesConfig` e atualizar `Plan`.
2.  **Seed Update:** Criar os planos padrão ("Gestor Padrão" e "Ambra Premium") com as taxas do ROI configuradas no JSON.
3.  **Refatoração Backend:** Substituir `TransactionSplitter` pelo `FeeCalculatorService` que lê do banco.
4.  **Frontend:** Atualizar tela de Checkout para mostrar o breakdown das taxas (transparência) e ofertar o Premium ("Economize R$ X assinando agora").

Esta arquitetura permite que você mude uma taxa de "5%" para "4.5%" para uma escola específica editando apenas um JSON no banco, sem tocar em uma linha de código.
