# Skill: Scaffold Backend Module
Description: Cria a estrutura completa de um novo módulo NestJS no backend.

## Trigger
Use esta skill quando o usuário pedir para "criar um módulo", "criar um recurso" ou "scaffold" no backend.

## Actions
1. **Verificar Localização**: Confirme que está operando em `apps/backend/src/modules`.
2. **Estrutura**:
   Para um módulo chamado `NAME`:
   - `NAME/NAME.module.ts`
   - `NAME/NAME.controller.ts`
   - `NAME/NAME.service.ts`
   - `NAME/dto/create-NAME.dto.ts`
   - `NAME/dto/update-NAME.dto.ts`
3. **Conteúdo**:
   - Use o CLI do NestJS se disponível (`nest g resource`), caso contrário, crie os arquivos manualmente seguindo os padrões existentes (Controller com Decorators Swagger, Service com Injectable, DTOs com ClassValidator).
4. **Registro**:
   - Lembre de registrar o módulo no `app.module.ts` (imports).
