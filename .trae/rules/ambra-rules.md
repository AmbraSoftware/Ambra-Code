# Regras do Projeto Ambra

## 1. Arquitetura & Estrutura (Monorepo)
Este projeto é um monorepo gerenciado com **NPM Workspaces**.
- **Backend**: `apps/backend` (NestJS v10+, Prisma, PostgreSQL).
- **Web App**: `apps/ambra-flow` (Next.js, Playwright para E2E).
- **Console**: `apps/ambra-console` (Next.js, Admin).
- **Mobile**: `apps/ambra-food` (React Native/Expo).

## 2. Padrões de Código (Backend)
- **Framework**: NestJS.
- **Banco de Dados**: Prisma ORM. Sempre atualize o `schema.prisma` e gere as migrações ao alterar modelos.
- **Validação**: Use `class-validator` e `class-transformer` nos DTOs.
- **Arquitetura**: Módulos encapsulados (Controller, Service, Module).

## 3. Padrões de Código (Frontend)
- **Framework**: Next.js (App Router).
- **Estilização**: Tailwind CSS. Evite CSS puro.
- **Componentes**: Funcionais com Arrow Functions.
- **Hooks**: Use hooks customizados para lógica complexa (`hooks/`).

## 4. Testes
- **E2E**: Use Playwright (`apps/ambra-flow/tests/e2e`).
- **Padrão**: Os testes devem cobrir fluxos críticos (Login, Cadastro, Checkout).

## 5. Convenções Gerais
- **Idioma**: Código e Commits em Inglês. Conteúdo de texto/UI em Português (pt-BR).
- **Pacotes**: Use `npm install` na raiz ou com `-w apps/<app>` para dependências específicas.
- **Commits**: Siga o padrão Conventional Commits (feat, fix, docs, style, refactor).
