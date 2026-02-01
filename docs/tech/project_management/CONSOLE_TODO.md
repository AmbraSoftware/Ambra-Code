# 📋 Plano de Batalha - Atualização do Ambra Console

## 🎯 Objetivo
Atualizar o `apps/ambra-console` para suportar as mudanças arquiteturais implementadas no Ambra Flow e Backend:
1. **Escola Híbrida** (Merenda + Cantina)
2. **Multi-Role** (Array de roles por usuário)
3. **Shared Types** (`@nodum/shared`)

---

## 📦 TAREFA 1: Integração com `@nodum/shared`

### Status: ❌ Não Implementado

### Ações Necessárias:

1. **Adicionar dependência:**
   ```json
   // package.json
   "dependencies": {
     "@nodum/shared": "workspace:*"
   }
   ```

2. **Substituir tipos locais por shared:**
   - `src/types/index.ts` → Usar `UserRole`, `CreateUserDto`, etc. de `@nodum/shared`
   - Remover definições duplicadas de roles e DTOs

3. **Arquivos a atualizar:**
   - `src/components/dashboard/dialogs/CreateUserDialog.tsx`
   - `src/components/dashboard/dialogs/EditUserDialog.tsx`
   - `src/components/dashboard/dialogs/CreateSchoolDialog.tsx`
   - `src/components/dashboard/dialogs/EditSchoolDialog.tsx`
   - Qualquer arquivo que use tipos de usuário/escola

---

## 🏫 TAREFA 2: Criação de Escola Híbrida

### Status: ❌ Não Implementado

### Arquivo: `src/components/dashboard/dialogs/CreateSchoolDialog.tsx`

### Mudanças Necessárias:

1. **Adicionar campos ao formulário:**
   ```typescript
   const formSchema = z.object({
     // ... campos existentes ...
     hasMerenda: z.boolean().default(false),
     hasCanteen: z.boolean().default(false),
   });
   ```

2. **Adicionar UI no formulário:**
   - Seção "Configuração Híbrida" após os dados básicos
   - Dois toggles/checkboxes:
     - ☑️ **Habilitar Merenda Escolar** (`hasMerenda`)
     - ☑️ **Habilitar Cantina Comercial** (`hasCanteen`)
   - Validação: Pelo menos um deve estar ativo
   - Descrição: "Escolas podem operar em modo híbrido, oferecendo tanto merenda governamental quanto vendas comerciais."

3. **Atualizar payload:**
   ```typescript
   const payload = {
     ...values,
     hasMerenda: values.hasMerenda,
     hasCanteen: values.hasCanteen,
   };
   ```

4. **Backend espera:**
   - Verificar endpoint `/tenancy/schools` no backend
   - Confirmar se aceita `hasMerenda` e `hasCanteen` no body

---

## 👥 TAREFA 3: Criação de Usuários com Multi-Role

### Status: ❌ Não Implementado

### Arquivo: `src/components/dashboard/dialogs/CreateUserDialog.tsx`

### Mudanças Necessárias:

1. **Atualizar schema para suportar array de roles:**
   ```typescript
   const formSchema = z.object({
     // ... campos existentes ...
     roles: z.array(z.nativeEnum(UserRole)).min(1, "Selecione pelo menos uma função"),
     // Manter 'role' como fallback para compatibilidade se necessário
   });
   ```

2. **Substituir Select simples por Multi-Select:**
   - Usar componente de seleção múltipla (ex: `MultiSelect` ou `CheckboxGroup`)
   - Mostrar todas as roles disponíveis do `UserRole` enum:
     - `MERCHANT_ADMIN` (Novo)
     - `SCHOOL_ADMIN`
     - `SUPER_ADMIN`
     - `OPERATOR_SALES` (Novo)
     - `OPERATOR_MEAL` (Novo)
     - `STUDENT`
     - `GUARDIAN`
     - Roles legacy (se necessário): `CANTEEN_OPERATOR`, `OPERATOR_ADMIN`, etc.

3. **Atualizar payload para enviar array:**
   ```typescript
   const payload: CreateUserDto = {
     ...values,
     roles: values.roles, // Array de roles
     // Backend aceita tanto 'role' (single) quanto 'roles' (array)
   };
   ```

4. **Importar tipos do shared:**
   ```typescript
   import { CreateUserDto, UserRole } from '@nodum/shared';
   ```

5. **Validação:**
   - Pelo menos uma role deve ser selecionada
   - Validar combinações inválidas (ex: `STUDENT` + `MERCHANT_ADMIN` não faz sentido)

---

## 🔄 TAREFA 4: Atualizar Diálogo de Edição de Usuário

### Status: ❌ Não Implementado

### Arquivo: `src/components/dashboard/dialogs/EditUserDialog.tsx`

### Mudanças Necessárias:

1. **Carregar roles existentes:**
   - Se o usuário tem `roles` (array), usar isso
   - Se tem apenas `role` (single), converter para array

2. **Permitir edição de múltiplas roles:**
   - Mesmo componente multi-select do CreateUserDialog
   - Permitir adicionar/remover roles

3. **Payload de atualização:**
   ```typescript
   const payload: Partial<CreateUserDto> = {
     roles: formValues.roles, // Array atualizado
   };
   ```

---

## 📝 TAREFA 5: Atualizar Tipos Locais

### Status: ❌ Não Implementado

### Arquivo: `src/types/index.ts`

### Mudanças Necessárias:

1. **Remover definições duplicadas:**
   - Remover enum `UserRole` local (se existir)
   - Remover interface `CreateUserDto` local (se existir)
   - Remover interface `School` local (se existir)

2. **Re-exportar do shared:**
   ```typescript
   export { UserRole, CreateUserDto, CreateSchoolDto } from '@nodum/shared';
   ```

3. **Manter apenas tipos específicos do Console:**
   - Tipos de dashboard
   - Tipos de métricas
   - Tipos de auditoria

---

## 🧪 TAREFA 6: Testes e Validação

### Status: ❌ Não Implementado

### Checklist:

- [ ] Criar escola híbrida (merenda + cantina)
- [ ] Criar escola apenas com merenda
- [ ] Criar escola apenas com cantina
- [ ] Criar usuário com múltiplas roles
- [ ] Criar usuário com role única (compatibilidade)
- [ ] Editar usuário para adicionar/remover roles
- [ ] Verificar se backend aceita os novos formatos
- [ ] Testar integração com `@nodum/shared`

---

## 📋 Ordem de Execução Recomendada

1. **TAREFA 1** (Shared Types) - Base para tudo
2. **TAREFA 5** (Tipos Locais) - Limpeza
3. **TAREFA 3** (Multi-Role Create) - Funcionalidade crítica
4. **TAREFA 4** (Multi-Role Edit) - Complemento
5. **TAREFA 2** (Escola Híbrida) - Feature nova
6. **TAREFA 6** (Testes) - Validação final

---

## ⚠️ Pontos de Atenção

1. **Backend Compatibility:**
   - Verificar se o backend já aceita `roles` (array) ou se precisa de migração
   - Verificar se o endpoint de criação de escola aceita `hasMerenda` e `hasCanteen`

2. **Legacy Support:**
   - Manter suporte para roles antigas (`CANTEEN_OPERATOR`, `OPERATOR_ADMIN`) se ainda existirem no sistema
   - Considerar migração gradual

3. **UI/UX:**
   - Multi-select de roles deve ser intuitivo
   - Toggles de escola híbrida devem ter descrições claras
   - Validar combinações inválidas de roles

4. **Type Safety:**
   - Usar `CreateUserDto` do shared garante type safety
   - Validar no frontend antes de enviar ao backend

---

## 🎯 Resultado Esperado

Após completar todas as tarefas:

✅ Console cria escolas híbridas (merenda + cantina)  
✅ Console cria usuários com múltiplas roles  
✅ Console usa tipos compartilhados (`@nodum/shared`)  
✅ Console está sincronizado com Flow e Backend  
✅ Type safety garantido em todo o monorepo  

---

**Data de Criação:** 2026-01-26  
**Prioridade:** Alta (Bloqueia funcionalidades críticas)  
**Estimativa:** 4-6 horas de desenvolvimento
