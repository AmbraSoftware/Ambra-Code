Implementar uma solução robusta baseada em **Tratamento de Erros Semântico** no backend e **Padrão Test Data Factory** no frontend.

1.  **Backend (`auth.service.ts`):**
    *   Adicionar tratamento `try/catch` específico para erros do Prisma (`P2002`, `P2007`).
    *   Converter erros de banco em exceções HTTP claras (`ConflictException`, `BadRequestException`).
    *   Garantir integridade transacional na criação de Escola+Usuário.

2.  **Frontend Test (`register.spec.ts`):**
    *   Criar função `generateValidCNPJ` baseada em algoritmo real (Módulo 11).
    *   Garantir unicidade de dados usando `timestamp` nos campos chave (Email, Slug).
    *   Adicionar "Guard Assertions": Verificar erros de validação (UI) e Toasts de erro (API) antes de esperar pelo timeout do Modal.

Isso resolverá a raiz do problema (dados inválidos/conflitantes e falha silenciosa) de forma definitiva.