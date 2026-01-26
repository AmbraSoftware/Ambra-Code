# Plano de Excelência: Sanitização de Dados e Correção de Fluxo

Atendendo às novas diretrizes, este plano foca na integridade dos dados (sanitização rigorosa) e na otimização da experiência do usuário (UX) no cadastro.

## 1. Sanitização e Validação de Dados (Front-end)

**Objetivo:** Garantir que o backend receba apenas dados limpos e válidos, prevenindo erros 400 e inconsistências no banco.

**Ações:**
*   **Arquivo:** `src/app/register/manager/page.tsx`
*   **Implementação:**
    *   **Remoção de Máscaras:** Criar função utilitária `sanitizeNumeric(value)` que remove tudo que não for dígito (`\D/g`). Aplicar em:
        *   `taxId` (CPF/CNPJ) -> Apenas números (11 ou 14 dígitos).
        *   `mobilePhone` -> Apenas números (10 ou 11 dígitos).
        *   `postalCode` -> Apenas números (8 dígitos).
    *   **Validação Pré-envio:** Adicionar verificação explícita antes do `authService.register`:
        *   Se `taxId` limpo não tiver 11 ou 14 dígitos -> Bloquear e alertar.
        *   Se `postalCode` limpo não tiver 8 dígitos -> Bloquear e alertar.
    *   **Tipagem:** Garantir que campos opcionais vazios sejam enviados como `undefined` ou `null` (não string vazia `""`), conforme esperado por APIs RESTful padrão.

## 2. Estratégia do Plano (`planId`)

**Decisão:** **Seleção Durante o Cadastro (Simplificado)**
Considerando que o `Ambra Flow` é um SaaS B2B (Gestão Escolar), a decisão do plano é fundamental. Para o MVP/Fase atual, manter a seleção no cadastro reduz o atrito de onboard pós-login.

**Ações:**
*   **Arquivo:** `src/app/register/manager/page.tsx`
*   **Implementação:**
    *   Definir um valor padrão para `planId` (ex: `'standard'`) no estado inicial ou garantir que o radio button o defina.
    *   No payload, enviar esse ID fixo se o usuário não alterar, garantindo que nunca seja `undefined`.

## 3. Correção da UX do Modal (Links Quebrados)

**Objetivo:** Resolver a navegação indesejada para `#` ao clicar em "Termos de Uso".

**Ações:**
*   **Arquivo:** `src/app/register/page.tsx` (e verificar `manager/page.tsx`)
*   **Implementação:**
    *   Localizar o trecho JSX: `Li e concordo com os <a href="#">...</a>`.
    *   Substituir por `<button type="button" onClick={() => openModal('terms')} class="...">...</button>`.
    *   Isso garante que o clique abra o modal na aba correta sem alterar a URL ou rolar a página.

## 4. Testes de Regressão e Carga

**Ações:**
*   Atualizar o teste `tests/e2e/register.spec.ts` para:
    *   Validar que o payload interceptado está estritamente numérico.
    *   Verificar o comportamento dos novos botões de link.
    *   Simular o fluxo completo até o sucesso.

Deseja autorizar este plano refinado?
