# Nodum Ecosystem (Monorepo)

Monorepo com o backend (Nodum Kernel) e aplicações Ambra (web e mobile), usando npm workspaces.

## Estrutura

- `apps/backend`: API principal (NestJS) + Prisma/Postgres.
- `apps/ambra-flow`: app web (Next.js) para gestores e operadores.
- `apps/ambra-console`: console web (Next.js) para administração global.
- `apps/ambra-food`: app mobile (Expo/React Native) voltado ao consumo/compra.
- `packages/shared`: pacote `@nodum/shared` com DTOs/enums utilitários usados entre apps.

## Workspaces e comandos

O repo usa npm workspaces (`apps/*` e `packages/*`).

- Instalar tudo: `npm install`
- Build de tudo: `npm run build:all`
- Dev (atalhos na raiz):
  - Backend: `npm run backend:dev`
  - Console: `npm run console:dev`
  - Flow: `npm run flow:dev`
  - Food: `npm run food:dev`

## Backend (apps/backend)

### Camadas principais

- `src/common`: infra transversal (contexto de request/tenant, guards, middleware, interceptors, filtros, cache).
- `src/modules`: módulos de domínio (Nest Modules), controllers/services e DTOs.
- `prisma/`: schema, migrations e seed.

### Módulos (alto nível)

- `auth`: autenticação/autorização (JWT, roles/guards).
- `tenancy`: gestão de tenants (escolas/governos) e exposição pública quando aplicável.
- `platform`: operações administrativas globais (sistemas, planos, health, billing).
- `operators`: gestão de operadores (entidades financeiras).
- `orders`: pedidos e fluxo de compra.
- `transactions`: lançamentos/ledger, split e cálculo de taxas.
- `payment`: integrações de pagamento e webhooks.
- `asaas`: integração com Asaas (inclui webhook handling e idempotência).
- `fiscal`: emissão/controle fiscal e itens pendentes.
- `communication`: anúncios e comunicação (inclui mail).
- `dashboard`, `metrics`, `export`: dados agregados, métricas e exportações.
- `stock`, `products`, `canteen`: operação (estoque, produtos, cantinas).
- `queue`, `tasks`, `notifications`: assíncrono, jobs e notificações.
- `risk`, `health`, `ai`, `import`, `invitations`, `storage`, `school-admin`: módulos de suporte e features específicas.

## Ambra Console (apps/ambra-console)

Next.js (App Router) com UI em `src/components`, páginas em `src/app` e hooks/contextos em `src/hooks` e `src/contexts`.

- Rotas principais ficam em `src/app/dashboard/*`.
- Tipos globais do console ficam em `src/types`.

## Ambra Flow (apps/ambra-flow)

Next.js com rotas separadas para perfis (manager/operator) e serviços HTTP centralizados em `src/services`.

## Shared (packages/shared)

Pacote `@nodum/shared` com DTOs/enums e dependências comuns (ex.: class-validator/class-transformer).

## Docs rápidos

- Handoff operacional: `HANDOFF.md`

