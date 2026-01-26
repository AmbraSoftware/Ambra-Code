# Plano de Testes E2E (Ponta a Ponta) - Ambra Console

Para garantir que o sistema está robusto e funcional, executarei uma bateria de testes automatizados diretamente na interface (`http://localhost:3001`), cobrindo todo o ciclo de vida dos dados (CRUD + Lixeira).

## 1. Preparação e Acesso
- [ ] Verificar conexão com `http://localhost:3001`.
- [ ] Validar autenticação (Login) se necessário.

## 2. Módulo: Entidades (A Base do Sistema)
### Sistemas (Vertical de Negócio)
- [ ] **Create**: Criar um novo Sistema "Sistema de Teste QA".
- [ ] **Read**: Verificar se ele aparece na lista.
- [ ] **Update**: Alterar o nome para "Sistema QA Editado".
- [ ] **Delete**: Arquivar o sistema.
- [ ] **Restore**: Ir na Lixeira > Aba Entidades > Sistemas e restaurar.

### Escolas (Tenants)
- [ ] **Create**: Criar uma nova Escola vinculada ao sistema anterior.
- [ ] **Update**: Editar o CNPJ ou Nome da escola.
- [ ] **Delete**: Arquivar a escola.
- [ ] **Restore**: Restaurar via Lixeira.

## 3. Módulo: Planos (Comercial)
- [ ] **Create**: Criar Plano "Plano Teste Gold" (R$ 100,00).
- [ ] **Update**: Alterar preço para R$ 120,00 e Teto de Crédito.
- [ ] **Delete**: Arquivar o plano.
- [ ] **Restore**: Restaurar via Lixeira > Aba Anúncios > Planos.

## 4. Módulo: Usuários (Gestão de Acesso)
Testarei o fluxo completo para os principais perfis:
- [ ] **Gestor**: Criar -> Editar -> Arquivar -> Restaurar.
- [ ] **Operador**: Criar -> Editar -> Arquivar -> Restaurar.
- [ ] **Aluno**: Criar -> Editar -> Arquivar -> Restaurar.

## 5. Módulo: Configurações (Financeiro)
- [ ] **Update**: Alterar a "Taxa Global" na página de Configurações.
- [ ] **Verify**: Recarregar a página para garantir que o valor persistiu.

---
**Solicitação de Confirmação:**
Posso iniciar a execução automática destes testes no seu navegador agora? 
*Nota: Isso envolverá a criação e manipulação de dados reais no banco de desenvolvimento.*