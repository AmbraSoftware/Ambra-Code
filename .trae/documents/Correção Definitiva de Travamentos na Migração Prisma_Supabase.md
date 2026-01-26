# Diagnóstico Profundo e Plano de Correção (Migração Prisma + Supabase)

O problema não está no `schema.prisma`, mas na forma como o Prisma 7 (Early Access) e o driver nativo (`pg`) interagem com o Supabase Pooler durante comandos de CLI (`migrate`). O erro de "travamento" é clássico de **exaustão de conexões** ou **SSL Handshake indefinido** em conexões diretas.

## Diagnóstico dos Possíveis Erros (Por Probabilidade)

1.  **Alta Probabilidade: Conflito de Driver (`driverAdapters`) vs CLI**
    O projeto usa `prisma-adapter-pg` no código da aplicação (`seed.ts`, `prisma.service.ts`), mas a CLI do Prisma (`migrate`) tenta usar o motor Rust padrão. A mistura de configurações no `prisma.config.ts` (tentando forçar adapters) pode estar confundindo a CLI, fazendo-a esperar uma conexão que nunca fecha.

2.  **Média Probabilidade: SSL/TLS Handshake Hang**
    O Supabase exige SSL. Se o CLI do Prisma tentar conectar na porta 5432 sem os parâmetros SSL corretos (que o driver `pg` gerencia via código, mas a CLI precisa via string), a conexão fica pendente ("hanging") indefinidamente esperando resposta.

3.  **Média Probabilidade: "Phantom Connections" no Pooler**
    O comando `migrate reset` tenta dropar o banco. Se houver conexões ativas (do próprio VSCode, terminais anteriores ou do backend rodando), o comando trava esperando o release do lock.

## Plano de Ação (Correção em Lote)

### 1. Simplificação Radical do `prisma.config.ts`
Vamos remover a complexidade de configuração de adapters do arquivo de config, deixando-o puramente declarativo para a CLI. O driver adapter (`pg`) será configurado **apenas** no código da aplicação (`main.ts`, `seed.ts`), não na config global.

### 2. Ajuste Robusto da String de Conexão (`.env`)
Vamos forçar os parâmetros que garantem que a CLI funcione sem depender de código TypeScript:
*   Adicionar `&sslmode=require` explicitamente na `DIRECT_URL`.
*   Aumentar `connect_timeout` para 60s.
*   Garantir que a `DIRECT_URL` aponte para a porta 5432 (Session Mode) e a `DATABASE_URL` para 6543 (Transaction Mode).

### 3. Refatoração do `seed.ts` (O culpado oculto)
O script de seed atual instancia um `Pool` do `pg` manualmente. Se esse pool não for fechado corretamente (`await pool.end()`) em caso de erro, o processo do Node nunca termina, parecendo um travamento.
*   **Ação:** Garantir blocos `try/finally` robustos que matem o processo (`process.exit(1)`) se o pool não fechar.

### 4. Execução Manual via Script de Bypass
Em vez de confiar no `npx prisma migrate reset`, criaremos um script one-off que:
1.  Carrega o `.env`.
2.  Substitui `DATABASE_URL` pela `DIRECT_URL` em memória.
3.  Roda a migração diretamente via driver Rust padrão, contornando qualquer problema do driver adapter experimental.

## Etapas de Execução

1.  **Limpeza:** Reverter `prisma.config.ts` para o padrão suportado.
2.  **Configuração:** Ajustar `.env` com parâmetros SSL explícitos.
3.  **Seed:** Corrigir o gerenciamento de conexão no `seed.ts`.
4.  **Execução:** Rodar a migração usando a estratégia de bypass de URL.
