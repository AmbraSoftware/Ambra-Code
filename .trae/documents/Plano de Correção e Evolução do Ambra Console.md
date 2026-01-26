# Plano de Transformação: Ambra Console 100% (Analyst Grade)

Detectei o motivo exato dos dados vazios (um erro de código) e mapeei as lacunas funcionais que deixam o sistema com sensação de "incompleto".

## 1. Correção Crítica (O "Porquê" de estar vazio)
O Dashboard está vazio porque o endpoint está quebrando (Erro 500) antes de responder.
- **Bug:** No arquivo `GlobalMetricsService`, a variável `totalStudents` é usada no cálculo de conversão, mas eu esqueci de declará-la na query do banco.
- **Ação:** Adicionar a query real `prisma.user.count({ where: { role: 'STUDENT' } })` para corrigir o fluxo de dados.

## 2. Elevando o Nível (Combatendo a sensação de "Fake")
Para um Analista Especialista, o sistema precisa ter "pulso" e controle granular.

### A. Dashboard "Vivo" (Live Feed)
Gráficos estáticos parecem falsos. Vou adicionar um widget de **"Atividade Recente"** diretamente na home do Dashboard.
- **O que fará:** Listará em tempo real as últimas ações críticas (ex: "Escola X criada", "Login de Admin", "Alteração de Plano") puxando diretamente dos `AuditLogs` reais.
- **Benefício:** Você verá o sistema reagindo a cada clique seu.

### B. Nova Página: Configurações Globais (`/dashboard/settings`)
Atualmente, configurações vitais (Taxas da Plataforma, Chaves de API) estão escondidas ou inexistentes.
- **Ação:** Criar uma página dedicada para o **Admin Global**.
- **Funcionalidades:** 
  - Gerenciar Taxas Padrão (SaaS, Split).
  - Visualizar Status de Integrações (Asaas, Gov).
  - Isso centraliza o poder de gestão, típico de sistemas enterprise.

### C. Refinamento de UX (Polimento)
- **Empty States Inteligentes:** Se não houver dados, exibir botões de ação rápida ("Cadastrar Primeira Escola") em vez de "0".
- **Sidebar de Notificações:** Garantir que o "sininho" esteja puxando os dados reais de Risco e Auditoria que implementamos.

---

**Ordem de Execução:**
1.  **Corrigir Backend:** Reparar `GlobalMetricsService` para trazer os dados reais (Correção do Erro 400/500).
2.  **Dashboard UI:** Implementar o Widget de Atividade Recente e os Empty States.
3.  **Nova Página:** Criar `/dashboard/settings`.
