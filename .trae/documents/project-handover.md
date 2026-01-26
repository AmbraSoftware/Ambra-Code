# Documentação do Projeto Nodum

Este documento serve como um "cérebro externo" para contextualizar rapidamente qualquer desenvolvedor (ou IA) sobre o estado atual, arquitetura e decisões tomadas no ecossistema Nodum.

---

## 1. Visão Geral do Ecossistema

O **Nodum** é uma plataforma modular de gestão educacional e financeira, composta por três aplicações principais que se comunicam:

1.  **Backend (Nodum Core)**: API Central (NestJS).
2.  **Ambra Flow (Web)**: Painel de gestão para cantinas/escolas (Next.js).
3.  **Ambra Food (Mobile)**: App para pais/alunos pedirem comida (React Native/Expo).
4.  **Nodum Console (Web)**: Painel administrativo "Super Admin" para a franqueadora (Next.js).

---

## 2. Status Atual por Aplicação

### 🟢 Backend (Nodum Core)
*   **Tecnologia**: NestJS, TypeORM, Postgres.
*   **Status**: Estável e padronizado.
*   **Arquitetura**: Modular Monolith (Módulos: `Core`, `Business`, `Infrastructure`).
*   **Feitos Recentes**:
    *   Reorganização completa de pastas para padrão corporativo.
    *   Documentação JSDoc em serviços críticos (ex: `CanteenService`).
    *   Separação clara de responsabilidades.

### 🟢 Ambra Flow (Web - Gestão)
*   **Tecnologia**: Next.js 14+, Tailwind CSS, Shadcn/UI.
*   **Status**: Funcional e integrado.
*   **Feitos Recentes**:
    *   Correção de timeouts na API (Axios).
    *   Correção de loop de logout (Interceptor 401).
    *   Integração com variáveis de ambiente (`NEXT_PUBLIC_API_URL`).

### 🟡 Ambra Food (Mobile - App Final)
*   **Tecnologia**: React Native, Expo, NativeWind (Tailwind), Supabase Auth.
*   **Status**: Em configuração inicial (Ambiente estabilizado).
*   **Desafios Superados**:
    *   Conflito de versões React 19.2 vs 19.1 (Downgrade realizado).
    *   Erro de "New Architecture" com NativeWind (Desativado `newArchEnabled`).
    *   Configuração do Supabase e API Client padronizados com o padrão Web.
*   **Próximos Passos**: Implementação das telas (Login, Home, Carrinho) já scaffoldadas.

### 🔴 Nodum Console (Web - Admin)
*   **Tecnologia**: Next.js 16 (Turbopack), Tailwind v4.
*   **Status**: **Erro de Build Atual**.
*   **Problema**: Conflito entre configuração do Tailwind v3 (`tailwind.config.ts`) e o CSS do Tailwind v4 (`@import "tailwindcss"`).
*   **Solução em Andamento**: Migração completa para Tailwind v4 (removendo `tailwind.config.ts` e movendo config para CSS puro).

---

## 3. Padrões de Projeto (Conventions)

### Autenticação & Segurança
*   **Web & Mobile**: Usam JWT.
*   **API Client**: Padrão `axios` com interceptors.
    *   *Request*: Injeta token `Bearer`.
    *   *Response*: Redireciona para login em caso de `401`.
*   **Env Vars**:
    *   Web: `NEXT_PUBLIC_`
    *   Mobile: `EXPO_PUBLIC_`
    *   Backend: `.env` padrão.

### Estilização
*   **Corporativo**: Uso estrito de Tailwind CSS.
*   **Cores**: Definidas via variáveis CSS (`--primary`, `--secondary`) para suportar temas (Dark/Light) nativamente.

---

## 4. Guia de Recuperação Rápida

Se você (ou outra IA) assumir agora, aqui está o **Plano de Ação Imediato**:

1.  **Consertar Nodum Console**:
    *   O erro `Cannot read properties of undefined (reading 'All')` é porque o Next.js 16 + Tailwind v4 não usa mais `tailwind.config.ts`.
    *   *Ação*: Deletar `tailwind.config.ts` e migrar as configurações de tema diretamente para o `@theme` no `globals.css`.

2.  **Desenvolver Ambra Food**:
    *   O ambiente mobile está pronto e rodando (`npx expo start -c`).
    *   As telas estão criadas mas vazias (`app/(tabs)`).
    *   *Ação*: Implementar UI seguindo o PRD `ambra-food-prd.md`.

3.  **Manter Backend**:
    *   Qualquer nova funcionalidade no mobile deve verificar se o Backend suporta (ex: rotas de cardápio e pedidos).

---

**Última Atualização**: 17/01/2026 - Pós-estabilização do ambiente Mobile e identificação do erro de build no Console.
