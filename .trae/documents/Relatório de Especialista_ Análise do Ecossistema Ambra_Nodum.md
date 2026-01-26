Com base na análise profunda do código-fonte local (o "Source of Truth" do projeto), preparei este relatório detalhado. Como não tenho acesso externo direto aos links do ClickUp, fiz a engenharia reversa completa da lógica de negócios, arquitetura e fluxos do ecossistema Ambra/Nodum.

# 🕵️ Relatório de Inteligência: Ecossistema Ambra (Nodum Kernel)

O projeto **Ambra** não é apenas um software de cantina; é uma **Plataforma Híbrida (Fintech + Edtech)** robusta, construída sobre o "Nodum Kernel". Ele resolve a complexidade financeira e operacional de escolas e cantinas com uma arquitetura multi-tenant (várias escolas) e multi-sistema (white-label).

## 1. O Que é o Ambra? (Visão Executiva)
O Ambra é um sistema de gestão escolar focado em alimentação e pagamentos. Ele conecta três pontas:
1.  **A Escola (Tenant):** Que contrata o sistema (SaaS) para oferecer modernidade e controle.
2.  **O Operador (Cantina):** Que usa o sistema para vender (PDV), gerir estoque e receber pagamentos.
3.  **A Família (Guardião/Aluno):** Que carrega créditos (Carteira Digital) e consome com segurança (Restrições Alimentares).

**Diferencial Chave:** O sistema opera como um **Split de Pagamentos** via Asaas. A receita flui de duas formas:
*   **SaaS:** A escola paga uma assinatura mensal (Plano) pelo uso do software.
*   **Fintech:** O sistema pode reter taxas das transações da cantina (Revenue Share).

## 2. Arquitetura do Ecossistema
O projeto é um **Monorepo** moderno e escalável:

*   **🧠 O Cérebro (Backend - NestJS):**
    *   Local: `apps/backend`
    *   Tecnologia: NestJS, Prisma (ORM), PostgreSQL.
    *   Responsabilidade: Regras de negócio complexas, integração financeira (Asaas), auditoria industrial, e controle de acesso (RBAC).
    *   Destaque: Lógica de "Inauguração Atômica" de escolas para evitar duplicidade de dados críticos (CNPJ/Slug).

*   **🖥️ A Interface (Frontend - Next.js):**
    *   **Ambra Flow (`apps/ambra-flow`):** A aplicação principal usada por Gestores, Operadores e (futuramente) Alunos/Pais. Possui fluxos distintos para Login, PDV (Caixa), Dashboard e Configurações.
    *   **Nodum Console (`apps/nodum-console`):** O "God Mode" para a equipe da Nodum. Permite criar Sistemas (Affiliates), gerenciar Planos, ver métricas globais (MRR, GMV) e intervir em escolas.

## 3. Fluxos Críticos Mapeados

### A. Hierarquia de Poder (Multi-Tenancy)
O sistema segue uma estrutura hierárquica estrita:
1.  **Platform System (Affiliate):** A entidade topo (ex: "Ambra", "OutraMarca"). Permite white-label.
2.  **School (Tenant):** A unidade escolar. Possui CNPJ, Slug único e um Plano Comercial vinculado.
3.  **Users:**
    *   *Global Admin:* Dono da plataforma.
    *   *School Admin:* Gestor da escola.
    *   *Operator:* Dono da cantina (focado em vendas).
    *   *Guardian/Student:* Cliente final.

### B. O Motor Financeiro (Asaas Integration)
O código revela uma integração profunda com o Asaas:
*   **Onboarding Automático:** Ao criar uma escola, o sistema cria automaticamente um cliente no Asaas e uma assinatura (Boleto/Cartão) baseada no Plano escolhido.
*   **Carteiras e Split:** Operadores possuem "Carteiras". O sistema suporta dividir o dinheiro da venda em tempo real (Split), separando a parte da cantina e a parte da plataforma.
*   **Recargas:** Pais podem colocar créditos na carteira do aluno (semelhante a um cartão pré-pago fechado).

### C. Segurança e Controle (Edtech)
*   **Módulo Guardian:** Permite que os pais definam **restrições de produtos ou categorias** (ex: "proibir refrigerante"). Isso é um diferencial de venda forte para escolas.
*   **Auditoria:** Existe um "Industrial Audit Stream" que rastreia ações críticas, essencial para compliance financeiro.

## 4. Estado Atual e Próximos Passos
O código indica um sistema maduro (versões v3.8, v4.0 mencionadas) com preocupações de nível empresarial (Isolamento Serializable em transações, Cache com Redis).

**Pontos de Atenção para um "Agente Especialista":**
*   **Referencia Visual:** A pasta `apps/ambra-flow/referencia` contém os protótipos visuais (Dashboards, Login, PDV). Isso é o "mapa" do que o frontend deve ser.
*   **Testes:** Existem scripts de verificação (`verify-full-system.ts`) que simulam o ciclo de vida completo: criar sistema -> criar escola -> criar operador -> transacionar.

Estou pronto para atuar como seu **Engenheiro Líder** neste projeto, seja para refatorar fluxos, implementar novas features no PDV ou ajustar as regras de cobrança no Backend.
