Entendido. Vamos elevar o nível para "Excelência Cirúrgica". O foco será transformar o `ambra-console` em uma ferramenta de **Alta Performance** para Análise e Gestão.

### 1. Performance e Arquitetura (O "Motor")
*   **Padronização com TanStack Query (React Query)**: Vou eliminar usos mistos de `fetch`, `axios` direto ou `swr`. O `TanStack Query` será a única fonte de verdade para dados do servidor, garantindo cache inteligente, *refetch* em segundo plano e zero "loading spinners" desnecessários (uso de *optimistic updates*).
*   **Formulários de Alta Performance**: Garantir que todos os formulários (Modais de criação/edição) usem `react-hook-form` com validação `zod`. Isso evita re-renderizações da página inteira ao digitar e garante dados limpos para o backend.

### 2. O "Centro de Comando" (Novo Dashboard)
*   **Destruir e Reconstruir a Home**: A página inicial atual será substituída por um **Dashboard Analítico** real.
*   **Biblioteca Gráfica**: Introdução do `Recharts` para visualização de dados.
*   **Widgets**:
    *   **Crescimento de Usuários/Tenants** (Gráfico de Linha).
    *   **Saúde do Sistema** (Status em tempo real dos serviços críticos).
    *   **Atividade Recente** (Logs de auditoria resumidos).
    *   **Riscos Críticos** (Alertas de segurança).

### 3. Gestão Avançada (Telas Internas)
*   **Audit (Refatoração Total)**: Foco 100% em **Segurança e Rastreabilidade**. Tabela de logs detalhada com filtros por IP, Usuário e Ação. Nada de custos operacionais manuais.
*   **Notificações (Sidebar)**: Implementação da Sidebar lateral (Sheet) para o "Sininho", agregando alertas de todos os módulos (Risco, Auditoria, Assinaturas).

### 4. Polimento de UX (Detalhes)
*   **Feedback Instantâneo**: Skeletons (esqueletos de carregamento) em vez de spinners para uma sensação de carregamento instantâneo.
*   **Padronização Visual**: Aplicar o componente `DataTable` (que criamos para Usuários) nas páginas de **Planos** e **Comunicados**, garantindo consistência total.

Começarei pela **Padronização do TanStack Query** e pela **Reconstrução da Home**, pois são a base da performance e da experiência de "análise". De acordo?
