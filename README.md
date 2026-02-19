# Ambra Ecosystem 🏰

> **Transformando a gestão escolar em uma experiência Fintech de alta performance.**

O **Ambra** é um ecossistema híbrido de gestão educacional e financeira desenhado para o cenário industrial (v3.8.24). Ele unifica PDV de alta velocidade, controle de merenda pública (Merenda IQ) e uma carteira digital segura para pais e alunos (Ambra Pay), tudo operando sobre um kernel de isolamento multi-tenant de nível bancário.

---

## 🚀 Para quem caiu de paraquedas

O Ambra resolve o atrito operacional em ecossistemas escolares, atacando três frentes simultâneas:
1. **Vertical de E-commerce & PDV**: Checkout híbrido (NFC + Foto) com lookup < 200ms para eliminar filas em cantinas privadas.
2. **Kernel de Governança**: Control plane global que gerencia transações, identidades e auditoria forense via cadeias HMAC.
3. **Fintech Compliance**: Um ledger bancário inviolável que garante que cada centavo (taxas, splits merchant/plataforma) seja auditável e imutável.

---

## 🛠️ Stack Tecnológica

O projeto é estruturado como um monorepo de alta densidade técnica:

| Camada | Tecnologia Principal |
| :--- | :--- |
| **Backend (Kernel)** | NestJS, TypeScript, Prisma ORM |
| **Bancos de Dados** | PostgreSQL, Redis (Caching Layer) |
| **Frontends (Web)** | Next.js 15+ (App Router), Vanilla CSS |
| **Mobile (PWA/Hybrid)** | React Native (Expo), React Query v5 |
| **Observabilidade** | Sentry, Prometheus/Grafana (Metrics) |
| **Fintech Gateway** | Integração Nativa ASAAS (Split/Subcontas) |

---

## 🛡️ Destaques da Arquitetura

### 1. Isolamento Multi-tenant via PostgreSQL RLS
Diferente de soluções comuns que filtram dados na camada de aplicação, o Ambra implementa **Row Level Security (RLS)** diretamente no banco de dados. Isso garante que o Tenant A nunca veja os dados do Tenant B, mesmo em caso de falhas críticas na lógica de aplicação.

### 2. Core Financeiro & Ledger Bancário
Toda transação (Recarga, Compra, Estorno) passa por um motor de integridade que utiliza:
- **Transações Atômicas**: Garantia via Prisma `$transaction`.
- **Optimistic Locking**: Controle de concorrência massiva via campo `version` em Wallets e Estoque.
- **HMAC Audit Chain**: Mutações são assinadas criptograficamente, criando uma trilha de auditoria estilo Blockchain.

### 3. Modularidade & White-label
A arquitetura separa claramente as regras de negócio core da experiência de domínio, permitindo escalabilidade horizontal e injeção de White-label dinâmico (css variables) via banco de dados.

---

## 🔗 Links & Contato

Para mais detalhes técnicos, consulte o [WALKTHROUGH.md](file:///c:/Users/Usuário/Documents/AmbraCode/Ambra-Code/WALKTHROUGH.md).

- **LinkedIn**: https://www.linkedin.com/in/gabriel-goncalves-de-souza-b7a15a352/
- **Portfólio/Currículo**: http://gabrielgsouza.dev.vercel.app
- **Documentação Detalhada**: `/docs`

---
*Ambra: Security first. Performance always.*
