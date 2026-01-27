# Handoff (Nodum / Ambra)

Este arquivo resume o estado atual do repositório para facilitar continuidade com outra IA.

## CI / GitHub Actions

- Workflow principal: `.github/workflows/main.yml`
- Node: `20.x` (necessário por dependências como `resend@6.7.0`)
- `npm ci` usa `--include=dev`
- Downloads de browsers desativados no CI:
  - `PUPPETEER_SKIP_DOWNLOAD=true`
  - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
  - `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
- Prisma no CI:
  - Define `DATABASE_URL` e `DIRECT_URL` dummy (apenas para permitir geração/compilação do client)
  - Executa `prisma generate` no workspace do backend antes do build

## Backend (apps/backend)

- Prisma Client precisa estar gerado para evitar erros de TS do tipo:
  - `Module '@prisma/client' has no exported member 'Prisma'`
  - delegates do PrismaService (ex.: `.user`, `.school`, `.$transaction`) “sumirem” no typecheck
- Testes:
  - `orders.stress.spec.ts` tem placeholder `it.skip(...)` para não quebrar o Jest por suite vazia
  - `transactions.service.spec.ts` foi ajustado para incluir `FeeCalculatorService` e alinhar com fee atual (=0)

## Ambra Console (apps/ambra-console)

Build do Next foi estabilizado com os seguintes ajustes:

- `CreateOperatorDialog` e `EditOperatorDialog` adicionados em `src/components/dashboard/dialogs/`
- Import de toast padronizado para `@/hooks/use-toast` (evitar `@/components/ui/use-toast`, que não existe)
- Páginas placeholder adicionadas:
  - `src/app/dashboard/settings/page.tsx`
  - `src/app/dashboard/status/page.tsx`
- `PageHeader` não aceita children; use a prop `actions` (ex.: em `dashboard/plans/page.tsx`)
- `sidebar-nav.tsx` importou o ícone `Package` do `lucide-react` (estava sendo usado sem import)

## Comandos úteis (local)

- Build backend: `npm run build --workspace=apps/backend`
- Test backend: `npm test --workspace=apps/backend`
- Build console: `npm run build --workspace=apps/ambra-console`

