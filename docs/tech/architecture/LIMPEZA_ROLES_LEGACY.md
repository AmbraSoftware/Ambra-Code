# ✅ Limpeza de Roles Legacy - Relatório Final

## 🎯 Objetivo
Remover roles legacy (`OPERATOR_ADMIN`, `GLOBAL_ADMIN`, `CANTEEN_OPERATOR`) e substituir por roles corretas, garantindo que o sistema use apenas as roles atuais do enum `UserRole`.

---

## ✅ TAREFA 1: Expurgo de Roles Legacy - CONCLUÍDO

### 1.1 Remoção do Enum

**Arquivos atualizados:**
- ✅ `packages/shared/src/enums.ts` - Removidas roles legacy
- ✅ `apps/backend/prisma/schema.prisma` - Removidas roles legacy do enum `UserRole`

**Antes:**
```typescript
export enum UserRole {
  // ... roles atuais ...
  // Legacy Roles (Compatibilidade)
  GLOBAL_ADMIN = 'GLOBAL_ADMIN',
  OPERATOR_ADMIN = 'OPERATOR_ADMIN',
  CANTEEN_OPERATOR = 'CANTEEN_OPERATOR',
}
```

**Depois:**
```typescript
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  MERCHANT_ADMIN = 'MERCHANT_ADMIN',
  OPERATOR_SALES = 'OPERATOR_SALES',
  OPERATOR_MEAL = 'OPERATOR_MEAL',
  GUARDIAN = 'GUARDIAN',
  STUDENT = 'STUDENT',
  CONSUMER = 'CONSUMER',
}
```

### 1.2 Substituições no Backend

**Mapeamento de Substituições:**
- `GLOBAL_ADMIN` → `SUPER_ADMIN` (acesso global ao sistema)
- `OPERATOR_ADMIN` → `MERCHANT_ADMIN` (dono da cantina/MEI)
- `CANTEEN_OPERATOR` → `OPERATOR_SALES` ou `OPERATOR_MEAL` (depende do contexto)

**Arquivos atualizados:**

1. **Controllers:**
   - ✅ `apps/backend/src/modules/tenancy/tenancy.controller.ts` - 8 substituições
   - ✅ `apps/backend/src/modules/users/users.controller.ts` - 9 substituições
   - ✅ `apps/backend/src/modules/canteen/canteen.controller.ts` - 3 substituições
   - ✅ `apps/backend/src/modules/orders/orders.controller.ts` - 1 substituição
   - ✅ `apps/backend/src/modules/products/products.controller.ts` - 5 substituições
   - ✅ `apps/backend/src/modules/dashboard/dashboard.controller.ts` - 3 substituições
   - ✅ `apps/backend/src/modules/metrics/metrics.controller.ts` - 2 substituições
   - ✅ `apps/backend/src/modules/transactions/transactions.controller.ts` - 1 substituição
   - ✅ `apps/backend/src/modules/audit/audit.controller.ts` - 3 substituições
   - ✅ `apps/backend/src/modules/notifications/notifications.controller.ts` - 1 substituição
   - ✅ `apps/backend/src/modules/communication/announcements/announcements.controller.ts` - 3 substituições
   - ✅ `apps/backend/src/modules/fiscal/fiscal.controller.ts` - 2 substituições
   - ✅ `apps/backend/src/modules/platform/platform.controller.ts` - 20 substituições
   - ✅ `apps/backend/src/modules/platform/global-admin.controller.ts` - 2 substituições
   - ✅ `apps/backend/src/modules/platform/finance.controller.ts` - 1 substituição
   - ✅ `apps/backend/src/modules/health/health.controller.ts` - 1 substituição
   - ✅ `apps/backend/src/modules/operators/operators.controller.ts` - 3 substituições

2. **Services:**
   - ✅ `apps/backend/src/modules/users/users.service.ts` - Removido `CANTEEN_OPERATOR` da validação
   - ✅ `apps/backend/src/modules/canteen/canteen.service.ts` - `CANTEEN_OPERATOR` → `OPERATOR_SALES`
   - ✅ `apps/backend/src/modules/auth/auth.service.ts` - `GLOBAL_ADMIN` → `SUPER_ADMIN`
   - ✅ `apps/backend/src/modules/wallet/wallet.service.ts` - 2 substituições
   - ✅ `apps/backend/src/modules/operators/operators.service.ts` - Comentários atualizados
   - ✅ `apps/backend/src/modules/platform/platform.service.ts` - Comentário atualizado

3. **Guards e Strategies:**
   - ✅ `apps/backend/src/modules/auth/guards/roles.guard.ts` - 2 substituições
   - ✅ `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` - Tipo atualizado
   - ✅ `apps/backend/src/modules/auth/dto/user-payload.dto.ts` - Tipo atualizado
   - ✅ `apps/backend/src/common/guards/subscription.guard.ts` - 1 substituição
   - ✅ `apps/backend/src/prisma/prisma.service.ts` - Comentário atualizado

4. **Scripts:**
   - ✅ `apps/backend/prisma/seed.ts` - 4 substituições
   - ✅ `apps/backend/src/scripts/create-operator-manual.ts` - 1 substituição
   - ✅ `apps/backend/src/scripts/create-operator-unlinked.ts` - 1 substituição
   - ✅ `apps/backend/src/scripts/verify-full-system.ts` - 1 substituição
   - ✅ `apps/backend/src/scripts/create-operator-admin.ts` - 1 substituição

### 1.3 Substituições no Frontend

**Ambra Flow:**
- ✅ `apps/ambra-flow/src/app/(operator)/layout.tsx` - `CANTEEN_OPERATOR` → `OPERATOR_SALES` ou `OPERATOR_MEAL`
- ✅ `apps/ambra-flow/src/app/(manager)/layout.tsx` - `OPERATOR_ADMIN` → `MERCHANT_ADMIN`, `GLOBAL_ADMIN` → `SUPER_ADMIN`
- ✅ `apps/ambra-flow/src/app/page.tsx` - 3 substituições
- ✅ `apps/ambra-flow/src/middleware.ts` - 3 substituições
- ✅ `apps/ambra-flow/src/app/(manager)/dashboard/staff/page.tsx` - 2 substituições
- ✅ `apps/ambra-flow/src/app/(manager)/dashboard/page.tsx` - 1 substituição

**Ambra Console:**
- ✅ `apps/ambra-console/src/components/dashboard/dialogs/CreateUserDialog.tsx` - Removida seção Legacy
- ✅ `apps/ambra-console/src/components/dashboard/dialogs/EditUserDialog.tsx` - Removida seção Legacy
- ✅ `apps/ambra-console/src/app/dashboard/users/page.tsx` - 2 substituições
- ✅ `apps/ambra-console/src/app/dashboard/trash/page.tsx` - 1 substituição
- ✅ `apps/ambra-console/src/components/audit/asaas-health-tab.tsx` - 1 substituição
- ✅ `apps/ambra-console/src/app/dashboard/announcements/page.tsx` - 2 substituições

---

## ✅ TAREFA 2: Honrar Módulos da Escola - CONCLUÍDO

### 2.1 CreateSchoolDto no Shared

**Arquivo criado:** `packages/shared/src/dtos/school.dto.ts`

**Implementação:**
```typescript
export class CreateSchoolDto {
  // ... campos existentes ...
  
  @IsBoolean()
  @IsOptional()
  hasMerenda?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCanteen?: boolean;
}
```

**Exportado em:** `packages/shared/src/index.ts`

### 2.2 Backend - CreateSchoolDto

**Arquivo:** `apps/backend/src/modules/tenancy/dto/create-school.dto.ts`

**Implementação:**
```typescript
import { CreateSchoolDto as SharedCreateSchoolDto } from '@nodum/shared';

export class CreateSchoolDto extends SharedCreateSchoolDto {
  // Adiciona validação customizada de CNPJ
  @Validate(IsCpfCnpj, { message: 'O CNPJ informado é inválido.' })
  override taxId!: string;
}
```

✅ **Usa Single Source of Truth do shared**

### 2.3 TenancyService - Criação Automática de Cantinas

**Arquivo:** `apps/backend/src/modules/tenancy/tenancy.service.ts`

**Implementação:**

1. **Salva flags no config:**
   ```typescript
   const schoolConfig: any = {
     primaryColor: '#FC5407',
     logo: 'https://cdn.nodum.app/ambra-default.png',
     hasMerenda: dto.hasMerenda || false,
     hasCanteen: dto.hasCanteen || false,
   };
   ```

2. **Cria cantinas automaticamente:**
   ```typescript
   if (dto.hasCanteen) {
     const commercialCanteen = await tx.canteen.create({
       data: {
         name: `Cantina - ${school.name}`,
         type: CanteenType.COMMERCIAL,
         schoolId: school.id,
         status: 'ACTIVE',
         openingTime: '07:00',
         closingTime: '18:00',
       },
     });
     createdCanteens.push(commercialCanteen);
   }

   if (dto.hasMerenda) {
     const governmentalCanteen = await tx.canteen.create({
       data: {
         name: `Refeitório Merenda - ${school.name}`,
         type: CanteenType.GOVERNMENTAL,
         schoolId: school.id,
         operatorId: null, // Merenda não requer operador
         status: 'ACTIVE',
         openingTime: '07:00',
         closingTime: '18:00',
       },
     });
     createdCanteens.push(governmentalCanteen);
   }
   ```

3. **Retorna informações das cantinas:**
   ```typescript
   return {
     message: 'Unidade industrial inaugurada com sucesso.',
     schoolId: school.id,
     adminId: admin.id,
     system: system.name,
     plan: plan.name,
     canteens: createdCanteens.map(c => ({ id: c.id, name: c.name, type: c.type })),
   };
   ```

✅ **Cantinas criadas automaticamente na mesma transação**

### 2.4 Frontend - CreateSchoolDialog

**Arquivo:** `apps/ambra-console/src/components/dashboard/dialogs/CreateSchoolDialog.tsx`

**Implementação:**
```typescript
const schoolPayload = {
  // ... campos existentes ...
  hasMerenda: values.hasMerenda,
  hasCanteen: values.hasCanteen,
};

const schoolResponse = await api.post('/tenancy/schools', schoolPayload);
const createdCanteens = schoolResponse.data.canteens || [];

// Mensagem de sucesso inclui informações das cantinas criadas
let description = `A escola ${values.name} foi adicionada ao ecossistema.`;
if (createdCanteens.length > 0) {
  const canteenNames = createdCanteens.map((c: any) => c.name).join(', ');
  description += ` ${createdCanteens.length} cantina(s) criada(s) automaticamente: ${canteenNames}.`;
}
```

✅ **Payload envia `hasMerenda` e `hasCanteen`**
✅ **Toast mostra informações das cantinas criadas**

---

## 📊 Resumo de Substituições

| Role Legacy | Substituição | Contexto |
|-------------|--------------|----------|
| `GLOBAL_ADMIN` | `SUPER_ADMIN` | Acesso global ao sistema |
| `OPERATOR_ADMIN` | `MERCHANT_ADMIN` | Dono da cantina/MEI |
| `CANTEEN_OPERATOR` | `OPERATOR_SALES` ou `OPERATOR_MEAL` | Operador de vendas ou merenda |

---

## ✅ Checklist Final

### TAREFA 1: Expurgo de Roles Legacy
- [x] Removidas do enum `UserRole` no shared
- [x] Removidas do enum `UserRole` no Prisma schema
- [x] Substituídas no backend (controllers, services, guards)
- [x] Substituídas no frontend (Flow e Console)
- [x] Scripts e seeds atualizados

### TAREFA 2: Honrar Módulos da Escola
- [x] `CreateSchoolDto` criado no shared com `hasMerenda` e `hasCanteen`
- [x] Backend `CreateSchoolDto` estende o shared
- [x] `TenancyService` salva flags no `config` JSON
- [x] `TenancyService` cria cantinas automaticamente:
  - [x] Cantina `COMMERCIAL` se `hasCanteen = true`
  - [x] Cantina `GOVERNMENTAL` se `hasMerenda = true`
- [x] `CreateSchoolDialog` envia os campos
- [x] Toast mostra informações das cantinas criadas

---

## 🎯 Resultado

**Status:** ✅ **TUDO OK - Limpeza Completa**

### Funcionalidades Validadas:

1. ✅ **Roles Legacy Removidas:**
   - Enum limpo (sem `GLOBAL_ADMIN`, `OPERATOR_ADMIN`, `CANTEEN_OPERATOR`)
   - Todas as referências substituídas
   - Frontends atualizados

2. ✅ **Escola Híbrida Funcional:**
   - Console envia `hasMerenda` e `hasCanteen`
   - Backend aceita e processa os campos
   - Cantinas criadas automaticamente:
     - `COMMERCIAL` se `hasCanteen = true`
     - `GOVERNMENTAL` se `hasMerenda = true`
   - Ambos podem ser `true` (escola híbrida completa)
   - Responsáveis diferentes podem ser atribuídos depois (via operadores)

3. ✅ **Single Source of Truth:**
   - `CreateSchoolDto` no shared
   - Backend estende o shared
   - Type safety garantido

---

## ⚠️ Migração de Banco de Dados Necessária

**IMPORTANTE:** A remoção de valores do enum `UserRole` no Prisma requer uma migration:

```sql
-- Esta migration precisa ser criada manualmente
-- PostgreSQL não permite remover valores de ENUM diretamente
-- É necessário criar um novo enum, migrar dados, e substituir

-- Exemplo de abordagem:
-- 1. Criar novo enum sem roles legacy
-- 2. Migrar dados: UPDATE users SET role = 'SUPER_ADMIN' WHERE role = 'GLOBAL_ADMIN';
-- 3. Substituir enum antigo pelo novo
```

**Recomendação:** Criar migration manual para migração de dados antes de remover valores do enum.

---

**Data de Implementação:** 2026-01-26  
**Status:** ✅ **Implementação Completa - Aguardando Migration de Banco**
