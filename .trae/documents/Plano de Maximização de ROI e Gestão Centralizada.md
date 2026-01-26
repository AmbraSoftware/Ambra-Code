Entendido. Vou aplicar as mudanças solicitadas focando em maximizar o valor do painel para o ROI e organizar a gestão de usuários e planos.

### 1. Refinamento de Métricas (ROI e Taxas)
*   **Ação**: Atualizar o `GlobalMetricsService` para calcular a receita real baseada no modelo de negócio descrito:
    *   **Receita B2B**: Taxas de Implantação + Mensalidades (Escolas) + Taxa por Recarga (3,00 + 5%) + Risco (1,00 + 4%) + Transação (4%).
    *   **Receita B2C**: Taxa Recarga Pais (2,00) + Risco (2,00) + Premium (15,99).
*   **Novos Gráficos**:
    *   **Breakdown de Receita**: Gráfico de barras empilhadas separando receita por fonte (Taxas vs Assinaturas vs Premium).
    *   **Conversão Premium**: KPI mostrando % de pais que aderiram ao plano Premium (Upsell).

### 2. Gestão de Usuários Unificada
*   **Ação**: Centralizar TODOS os usuários na página `/dashboard/users`.
*   **Abas**: Criar abas inteligentes: "Gestores", "Pais/Responsáveis", "Alunos", "Operadores de Cantina".
*   **Edição Completa**: Garantir que os modais de edição suportem todos os campos relevantes (limites de crédito, associação com escolas, etc).
*   **Limpeza**: Remover a aba "Operadores" da página de Entidades, já que agora viverá em Usuários.

### 3. Planos e Assinaturas (Backend Completo)
*   **Ação**: Atualizar a `PlansPage` para refletir todas as capacidades do backend.
*   **Novos Campos**: Adicionar visualização e edição de `creditCeiling` (Limite de Crédito Padrão), `maxCanteens` e configurações de taxas (`feesConfig`).
*   **Visual**: Exibir as taxas configuradas diretamente na tabela de planos para fácil conferência.

### 4. Auditoria Profissional
*   **Ação**: Adicionar ferramenta de **Exportação CSV** na página de Auditoria.
*   **Filtros**: Melhorar os filtros por data e tipo de ação para facilitar a busca por eventos específicos (ex: "Quem alterou o plano X?").

Vou começar atualizando o **Backend de Métricas** para suportar esses cálculos financeiros complexos e depois avançar para o Frontend. De acordo?
