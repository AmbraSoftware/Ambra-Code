# Plano de Finalização Ambra-Flow (Gold Standard)

Este plano visa elevar o projeto Ambra Flow a um nível de excelência "10x", com foco em design, robustez técnica e completude funcional.

## Estrutura do Projeto
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS v4, Framer Motion, Lucide React.
- **Gerenciamento de Estado:** React Query (TanStack Query) + Context API.
- **Padrões:** Desktop-first (Gestor) e Mobile-first (Operador).

## Roadmap de Sprints

### Sprint 1: Fundação e Design System (Imediato)
*Foco: Arquitetura, Componentes Base e Layouts*
1. **Auditoria de Design:** Refinar tokens de cores e tipografia no Tailwind v4.
2. **Componentes Atômicos:** Padronizar `Button`, `Input`, `Card`, `Modal`, `Table`, `Badge` com acessibilidade e variantes completas.
3. **Layouts Responsivos:** Refatorar `ManagerLayout` para extrair Sidebar e Header; otimizar navegação mobile.
4. **Configuração Global:** Garantir Providers (QueryClient, Theme, Toast) configurados corretamente.

### Sprint 2: Autenticação e Onboarding
*Foco: Segurança e Primeira Impressão*
1. **Telas de Login:** Refatorar UI/UX de `/login/manager` e `/login/operator`.
2. **Validação:** Implementar Zod + React Hook Form em todos os formulários de auth.
3. **Feedback:** Integrar `Sonner` para toasts de erro/sucesso.
4. **Recuperação de Senha:** Implementar fluxo completo.

### Sprint 3: Dashboard do Gestor (Desktop-First)
*Foco: Visualização de Dados e Performance*
1. **Data Fetching:** Migrar fetchs de `useEffect` para Hooks do React Query (`useDashboardMetrics`).
2. **Loading States:** Substituir spinners genéricos por Skeletons UI.
3. **Gráficos:** Refinar charts do Recharts com tooltips customizados e eixos limpos.
4. **Widgets:** Polir `StockAlertsWidget` e adicionar novos KPIs.

### Sprint 4: Área do Operador e POS (Mobile-First)
*Foco: Agilidade e Toque*
1. **POS UI:** Redesenhar grid de produtos para toque (tamanhos maiores, feedback tátil).
2. **Carrinho:** Otimizar sidebar/drawer do carrinho para mobile.
3. **Checkout:** Fluxo de pagamento em 3 cliques ou menos.
4. **Performance:** Otimizar renderização de listas longas de produtos.

### Sprint 5: Funcionalidades Core
*Foco: Regras de Negócio*
1. **Gestão de Produtos:** CRUD completo com upload de imagem (Drag & Drop).
2. **Estoque:** Fluxos de entrada/saída e inventário.
3. **Financeiro:** Relatórios de vendas e fechamento de caixa.
4. **Usuários:** Gestão de alunos e permissões.

### Sprint 6: Qualidade e Entrega
*Foco: Testes e Documentação*
1. **Testes:** Unitários (Jest) e E2E (Playwright).
2. **Documentação:** README técnico, Storybook (opcional) e Guia de Deploy.
3. **Build:** Otimização de bundle e verificação de lint/types.

---

## Próximos Passos Imediatos (Sprint 1)
1. Extrair e refatorar `Sidebar` do `ManagerLayout`.
2. Revisar e padronizar componentes UI (`Button`, `Input`, `Card`).
3. Criar Skeletons base para carregamento.
