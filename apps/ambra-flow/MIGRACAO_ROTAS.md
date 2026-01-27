# Migração de Rotas - Guia de Execução

## Status da Migração

### ✅ Backend Sync (Concluído)
- CreateUserDto criado no `packages/shared`
- Backend atualizado para usar DTO do shared
- Suporte a OPERATOR_SALES e OPERATOR_MEAL implementado
- Email opcional para operadores implementado

### 🔄 Migração de Rotas (Em Progresso)

#### Rotas Manager a Migrar:
1. `/manager/menu` → `/(manager)/dashboard/menu`
2. `/manager/users` → `/(manager)/dashboard/users`
3. `/manager/stock` → `/(manager)/dashboard/stock`
4. `/manager/financial` → `/(manager)/dashboard/financial`
5. `/manager/settings` → `/(manager)/dashboard/settings`
6. `/manager/communication` → `/(manager)/dashboard/communication`
7. `/manager/canteens` → `/(manager)/dashboard/canteens`
8. `/manager/canteens/[id]` → `/(manager)/dashboard/canteens/[id]`
9. `/manager/school-meals` → `/(manager)/dashboard/school-meals`
10. `/manager/orders` → `/(manager)/dashboard/orders`
11. `/manager/sales` → `/(manager)/dashboard/sales`

#### Rotas Operator a Migrar:
1. `/operator/pos` → `/(operator)/pos` ✅ (Já movido)
2. `/operator/history` → `/(operator)/history`
3. `/operator/queue` → `/(operator)/queue`
4. `/operator/settings` → `/(operator)/settings`

### 📝 Notas Importantes

- O layout `(manager)` já está configurado com os links corretos
- Após mover os arquivos, deletar as pastas antigas `app/manager` e `app/operator`
- Verificar todos os links internos que referenciam rotas antigas
