# Skill: Prisma Migration Flow
Description: Automatiza o fluxo de alteração de banco de dados com Prisma (Schema -> Migration -> Client).

## Trigger
Use quando o usuário pedir para "atualizar o banco", "criar tabela", "rodar migration" ou "alterar schema".

## Actions
1. **Contexto**: Garanta que está operando no diretório do backend (`apps/backend`) ou onde o `schema.prisma` reside.
2. **Passos**:
   - **Passo 1**: Pergunte ao usuário qual alteração ele deseja fazer no `schema.prisma` (se ainda não fez).
   - **Passo 2**: Edite o `schema.prisma` com a alteração solicitada.
   - **Passo 3**: Valide o schema: `npx prisma validate`.
   - **Passo 4**: Gere a migração: `npx prisma migrate dev --name <nome-descritivo>`.
     - *Dica*: Peça um nome curto e descritivo para a migração (ex: `add_user_profile`).
   - **Passo 5**: Gere o cliente (geralmente automático, mas bom garantir): `npx prisma generate`.
3. **Segurança**: Nunca rode `prisma migrate reset` em produção sem confirmação explícita e tripla.
