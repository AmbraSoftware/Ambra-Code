# Ambra Walkthrough

## 1. Visão Geral e Problema

O ecossistema escolar sofre com **atrito operacional e financeiro**. Filas longas em cantinas geram perda de receita (throughput baixo), enquanto a falta de controle parental sobre hábitos alimentares gera insegurança. 

O **Ambra** resolve isso através de um **PDV Financeiro/Nutricional** de baixíssima latência integrado a um motor de **Fintech White-label**.

---

## Stack de Tecnologias

O Ambra foi construído utilizando o que há de mais moderno e resiliente no desenvolvimento web e mobile:

*   **Linguagem Principal**: TypeScript em todo o ecossistema (Backend e Frontend), garantindo segurança de tipos de ponta a ponta.
*   **Backend**: NestJS, aproveitando sua arquitetura modular e escalável.
*   **Frontend (Web)**: Next.js (App Router) para interfaces administrativas e do cliente de alta performance.
*   **Frontend (Mobile)**: Expo / React Native para uma experiência PWA/Nativa fluida.
*   **Banco de Dados**: PostgreSQL (Hospedado via Supabase).
*   **ORM**: Prisma para modelagem segura e produtiva.
*   **Cache**: Redis para lookup instantâneo e redução de carga no banco.

---

## Modelos de Arquitetura

### Monólito Modular
O backend segue uma arquitetura de **Monólito Modular** com separação estrita de domínios. Essa escolha facilita a manutenção atual e permite migrações futuras para microserviços de forma transparente.

### Multi-tenancy e Isolamento
Utilizamos um sistema **Multi-tenant** robusto:
- **Filtros de `schoolId`**: Integrados ao `RequestContext` para todas as queries.
- **PostgreSQL RLS (Row Level Security)**: Isolamento nativo no banco para garantir privacidade absoluta entre escolas.

```sql
-- Exemplo do conceito implementado via Ambra
CREATE POLICY school_isolation_policy ON transactions
USING (school_id = current_setting('app.current_school_id')::uuid);
```

### Core Financeiro (Ledger Proprietário)
Baseado em um **Ledger Bancário** proprietário que utiliza transações atômicas (**Prisma Interactive Transactions**) para garantir integridade e evitar gastos duplos.

```typescript
// Exemplo de Fluxo de Compra Protegido
await prisma.$transaction(async (tx) => {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  
  // Verificação de versão (Optimistic Locking)
  const updatedWallet = await tx.wallet.update({
    where: { id: wallet.id, version: wallet.version },
    data: { 
      balance: { decrement: orderAmount },
      version: { increment: 1 } 
    }
  });
  
  // Registro Simultâneo da Transação
  await tx.transaction.create({ data: { ... } });
}, { isolationLevel: 'Serializable' });
```

---

## Ferramentas e Infraestrutura

A operação do Ambra é sustentada por uma infraestrutura de classe mundial:

*   **Deploy e Hospedagem**: Railway para o Backend e CloudFlare Pages para os Frontends.
*   **Gateway de Pagamento**: Asaas, com integração profunda via Webhooks idempotentes.
*   **Observabilidade**: Sentry (rastreamento de erros em tempo real) e Better Stack (monitoramento de uptime e logs consolidados).

---

## 5. Performance e Monitoramento

*   **Lookup < 200ms**: No PDV, o reconhecimento do aluno (NFC ou Busca) é acelerado por cache em Redis e índices PostgreSQL otimizados.
*   **Segurança**: Auditoria Forense via HMAC Chain, garantindo a imutabilidade de cada registro de transação.

---

## 6. Desafios e Lições Aprendidas

1. **Concorrência em Saldo**: Resolver "Race Conditions" em horários de pico (recreio) exigiu um refactoring profundo dos isolamentos de transação do banco.
2. **Resiliência Offline**: Implementamos um mecanismo de **Cache & Sync** onde as vendas são bufereadas localmente com validação de hash, garantindo operação mesmo sem rede.

---

## 🔗 Próximos Passos
Consulte a pasta [/docs](file:///c:/Users/Usuário/Documents/AmbraCode/Ambra-Code/docs) para especificações de API e fluxogramas de negócio.
