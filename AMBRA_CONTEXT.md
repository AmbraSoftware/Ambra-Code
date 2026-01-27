# AMBRA ECOSYSTEM - ARCHITECTURE & BUSINESS CONTEXT (V2.0 - HYBRID ERA)

## 1. Visão do Produto (Product Vision)
O Ambra é um Sistema Operacional Escolar Híbrido (SaaS + Fintech) que atende simultaneamente:
1. **Cantinas Privadas (Ambra Flow):** Foco em venda, lucro e agilidade (PDV Financeiro).
2. **Merenda Pública (Merenda IQ):** Foco em nutrição, controle de estoque e anti-desperdício (PDV Nutricional).
3. **Pais/Alunos (Ambra App):** Carteira digital e espelho de cardápio.

**Meta Atual:** Refatoração estrutural para suportar o modelo Híbrido (ETEC/Privada) e lançamento em Fev/2026.

## 2. Stack & Arquitetura (Monorepo)
- **Repo Manager:** Turborepo / NPM Workspaces.
- **Backend (Brain):** NestJS + Prisma + PostgreSQL. **Única fonte de verdade.**
- **Shared (Contract):** `packages/shared`. Contém DTOs, Enums e Interfaces. O Backend e os Frontends DEVEM consumir daqui.
- **Mobile:** React Native (Expo). **PROIBIDO** usar SDK do Supabase direto. Deve consumir a API do Backend via HTTP/React Query.
- **Web (Console/Flow):** Next.js 16 (App Router).

## 3. Pilares de Negócio (Regras Imutáveis)

### A. Identidade & RBAC (Role-Based Access Control)
- **Multi-Role:** Um usuário pode ter múltiplas funções (Array de Roles).
- **Roles Definidas:**
  - `SUPER_ADMIN`: Nodum (God Mode).
  - `SCHOOL_ADMIN`: Diretor/Nutricionista (Vê Merenda IQ, Dados Gerais).
  - `MERCHANT_ADMIN`: Dono da Cantina/MEI (Vê Financeiro, Vendas, Saque).
  - `OPERATOR_SALES`: Caixa (Apenas Vende/PDV).
  - `OPERATOR_MEAL`: Merendeira (Apenas Baixa Estoque/Check-in).
  - `CONSUMER`: Aluno/Responsável.

### B. Financeiro (Split & Wallet)
- **Entidade Financeira:** A conta bancária (Asaas) fica no `OPERATOR` (CNPJ), nunca na `SCHOOL` (Prédio), salvo em gestão unificada.
- **Split de Pagamento:**
  - O Pai paga o valor TOTAL (Recarga + Taxa Conveniência).
  - O Gateway (Asaas) divide na origem:
    - `Wallet Ambra`: Taxa Pai + Taxa Merchant.
    - `Wallet Merchant`: Valor Líquido.
- **Carteiras:** Existem tipos de Wallet: `STUDENT` (Consumo), `MERCHANT` (Recebimento), `AMBRA` (Receita).

### C. Híbrido: Venda vs. Consumo (Merenda IQ)
- **Produtos (`ProductType`):**
  - `SALE`: Tem preço, debita saldo da Wallet (Coxinha).
  - `CONSUMPTION`: Preço R$ 0,00 para o aluno, apenas baixa estoque (Arroz/Merenda).
- **Fluxo de Merenda:** Não existe "venda". Existe "Check-in Nutricional" (Baixa de estoque + Registro de consumo).

## 4. Diretrizes de Desenvolvimento (Coding Rules)

### Backend (NestJS)
1. **Validation:** Use `ZodValidationPipe` globalmente. Todos os DTOs devem ter schemas Zod no `packages/shared`.
2. **Auth:** Use `AuthService` com JWT que carrega o Array de Roles.
3. **Database:** Use Prisma. Nunca faça queries SQL puras a menos que estritamente necessário para performance.

### Frontend (Mobile & Web)
1. **Data Fetching:** Use **TanStack Query v5**. Evite `useEffect` para chamadas de API.
2. **State:** Prefira URL State (nuqs) ou Server State (React Query) a Global State (Zustand) para dados de negócio.
3. **Type Safety:** Importe tipos APENAS de `@nodum/shared`. Não redeclare interfaces.

### Segurança
1. **Mobile Blindado:** O App Mobile nunca deve ter chaves de Admin ou acesso direto ao DB.
2. **Zero Trust:** O Backend valida tudo (Saldo, Estoque, Permissão) independente do que o Frontend mandar.