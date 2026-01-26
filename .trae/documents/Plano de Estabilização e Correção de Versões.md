Aqui está o plano consolidado e o fluxo lógico de resolução para estabilizar o Nodum Ecosystem.

## Diagnóstico
Identificamos três camadas de problemas que deixaram o projeto instável:
1.  **Crítico (Infra)**: O Banco de Dados estava dessincronizado com o código, causando erros de login ("column not exists"). A tentativa de correção falhou por problemas de variáveis de ambiente.
2.  **Arquitetural (Hardening)**: O banco precisa de regras de segurança nativas (SQL) que o Prisma não gerencia, essenciais para a integridade financeira (ex: impedir saldo negativo).
3.  **Ambiente (Dependências)**: Incoerências de versões (TypeScript, ESLint, Tailwind) entre os apps Web e Mobile, gerando um ambiente de desenvolvimento frágil.

## Estratégia
Faremos um "Hard Reset" controlado na infraestrutura, seguido de uma padronização do ambiente de desenvolvimento.

---

## Fluxo de Execução Passo-a-Passo

### Fase 1: Reconstrução da Infraestrutura (O Alicerce)
*Dependência: Você reinicia o Schema `public` no Supabase manualmente.*
1.  **DB Push (Esqueleto)**: Executarei o comando `prisma db push` injetando corretamente as credenciais do backend. Isso criará todas as tabelas vazias (`User`, `School`, `Wallet`, etc.).
2.  **SQL Hardening (Alma)**: Executarei um script customizado para aplicar as regras de negócio bancárias (Extensions, Triggers de Auditoria, Constraints de Saldo). Isso transforma o banco "bobo" em um banco "financeiro".

### Fase 2: Estabilização do Ambiente (A Cola)
3.  **Unificação de TypeScript**: Atualizarei a versão do TypeScript na raiz do projeto para `^5.9.3` (alinhado com o backend), garantindo que a tipagem funcione igual em todo o monorepo.
4.  **Linting no Mobile**: Adicionarei `eslint` ao `ambra-food` para que o código mobile siga os mesmos padrões de qualidade da web.
5.  **Prisma Generate**: Regenerarei os clientes Prisma para garantir que o VS Code reconheça as novas tabelas e colunas.

### Fase 3: Validação (O Teste)
6.  **Reinício dos Serviços**: Reiniciarei o Backend e o Console.
7.  **Teste de Login**: Verificaremos se o erro de coluna desapareceu e se o acesso foi restaurado.

Este fluxo resolve a desconexão entre o código e o banco, blinda a segurança financeira e prepara o terreno para o desenvolvimento unificado.
