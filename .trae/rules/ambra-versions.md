# Regras de Versões e Dependências (Ambra Ecosystem)

Para manter a consistência e estabilidade do monorepo, siga estritamente estas versões ao adicionar novas dependências ou criar novos projetos.

## 1. Core Stack Versions
| Tecnologia | Versão Padrão | Escopo |
| :--- | :--- | :--- |
| **Node.js** | `v20` ou `v22` (LTS) | Global |
| **TypeScript** | `^5.0` | Global |
| **React** | `19.x` | Web & Mobile |
| **Next.js** | `16.x` (App Router) | Web (Console & Flow) |
| **NestJS** | `11.x` | Backend |
| **Prisma** | `7.x` | Backend |
| **Tailwind CSS** | `4.x` (Web) / `3.x` (Mobile) | UI Styling |

## 2. Padrões de Bibliotecas
### Frontend (Web)
- **Data Fetching**: `@tanstack/react-query` (v5).
- **Forms**: `react-hook-form` + `zod`.
- **UI Components**: Shadcn/UI (baseado em `@radix-ui`).
- **Icons**: `lucide-react`.
- **Date**: `date-fns` (v4).

### Mobile (React Native)
- **Framework**: Expo SDK 54+.
- **Router**: `expo-router`.
- **Styling**: `nativewind` (v4) + `tailwindcss`.

### Backend (NestJS)
- **Validation**: `class-validator` + `class-transformer`.
- **Docs**: `@nestjs/swagger`.
- **Queues**: `bullmq` (Redis).

## 3. Política de Atualização
- **Sincronia**: Ao atualizar o React ou TypeScript, atualize em **todos** os workspaces simultaneamente.
- **Tailwind**: Mantenha o Mobile na v3 até que o NativeWind suporte estavelmente a v4.
- **Lockfile**: Respeite o `package-lock.json` raiz. Use `npm install` na raiz para gerenciar dependências.
