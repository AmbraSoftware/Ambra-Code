Entendido. O diagnóstico está preciso: precisamos separar a conexão de transação (Pooler/6543) da conexão de migração (Direct/5432) para evitar o erro de *Prepared Statement* e garantir a integridade do schema.

Aqui está o plano de execução refinado para estabilizar o Nodum Kernel e o Ecossistema Ambra.

## Plano de Ação: Hard Reset & Unificação

### 🚧 Fase 1: Infraestrutura (Database Connection)
**Objetivo:** Garantir que o Prisma possa alterar o banco (Porta 5432) e a aplicação possa rodar com performance (Porta 6543).

1.  **Correção do `schema.prisma` (Backend)**:
    *   **Problema Detectado**: O bloco `datasource` está incompleto (faltam `url` e `directUrl`).
    *   **Ação**: Adicionar `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")` explicitamente.
2.  **Validação do `.env` (Backend)**:
    *   Confirmar que `DATABASE_URL` aponta para `pgbouncer=true` (Porta 6543).
    *   Confirmar que `DIRECT_URL` aponta para `sslmode=require` (Porta 5432).

*(Após esta etapa, você poderá rodar o `npx prisma db push` e o `SQL Hardening` com sucesso).*

### 🛠️ Fase 2: Unificação do Ambiente (DevEx)
**Objetivo**: Eliminar conflitos de versão entre Web, Mobile e Backend.

1.  **TypeScript Unificado**:
    *   Atualizar `package.json` na raiz para `typescript: ^5.9.3` (Alinhando monorepo).
2.  **Linting no Mobile**:
    *   Instalar `eslint` no `apps/ambra-food` para garantir qualidade de código no App.
3.  **Prisma Generate**:
    *   Rodar `prisma generate` para atualizar as tipagens do client (`@prisma/client`) usadas pelo VS Code.

### ✅ Fase 3: Validação Final
1.  **Reinício**: Reiniciar serviços do Backend.
2.  **Teste de Fumaça**: Verificar se o login ocorre sem erros de "column does not exist" ou timeout de conexão.

Vou iniciar pela **Fase 1** ajustando o `schema.prisma` e verificando o `.env`. De acordo?