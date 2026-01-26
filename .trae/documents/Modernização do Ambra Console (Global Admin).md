# Plano de Modernização do Ambra Console (Global Admin)

Realizei a análise profunda do **Nodum Console** e identifiquei que a funcionalidade de "Aprovação de Escolas Pendentes" já existe parcialmente, mas precisa ser elevada ao padrão "Bulletproof" que estabelecemos no Ambra Flow.

Abaixo está o plano para garantir robustez, performance e escalabilidade.

## 1. Backend: Otimização e Escalabilidade (NestJS)
Atualmente, o endpoint de listagem retorna *todas* as escolas. Isso ficará lento conforme o ecossistema cresce. Vamos implementar **filtragem server-side**.

*   **Endpoint:** `GET /tenancy/schools`
*   **Ação:** Adicionar suporte a query param `?status=PENDING`.
*   **Implementação:** Atualizar `TenancyController` e `TenancyService` para filtrar direto no banco de dados (Prisma).

## 2. Frontend: Migração para React Query (TanStack)
O console usa um hook `useFetch` simples. Vamos migrar para **TanStack Query** para ganhar:
*   **Cache & Real-time:** O contador de "Aprovações Pendentes" será atualizado automaticamente em background.
*   **Performance:** Cache dos dados para não recarregar a lista ao navegar entre abas.
*   **Estados de Loading/Erro:** Tratamento robusto de falhas de rede.

## 3. UI/UX: Tela de Aprovação "Bulletproof"
Vou refinar a aba de "Escolas" para destacar claramente a fila de aprovação.
*   **Indicadores Visuais:** O contador de pendências (Badge vermelho) será conectado ao estado global do React Query.
*   **Feedback de Ação:** Ao aprovar uma escola, a lista será atualizada instantaneamente (Optimistic UI ou invalidação de cache).
*   **Feedback de Erro:** Uso do `Sonner` (Toast) para confirmar sucesso ou erro na aprovação.

## Resumo das Tarefas
1.  **Backend:** Atualizar `TenancyController` para aceitar filtros de status.
2.  **Frontend:** Configurar `QueryClientProvider` no layout do Console (se não houver).
3.  **Frontend:** Refatorar `EntitiesPage` para usar `useQuery` e `useMutation`.
4.  **Frontend:** Polir a UX da tabela de aprovações (Badges, Botões de Ação, Feedback).

Posso prosseguir com essa execução?