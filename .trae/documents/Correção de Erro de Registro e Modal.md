# Plano de Correção: Erro 400 e Visibilidade do Modal

Com base na análise do código, identifiquei as causas prováveis para os problemas relatados e proponho as seguintes correções:

## 1. Correção do Erro 400 (Bad Request) no Registro

**Diagnóstico:**
O payload enviado para a API contém caracteres de formatação (máscaras) em campos que o backend provavelmente espera apenas números, além de enviar strings vazias para datas opcionais.

**Ações Planejadas:**
*   **Arquivo:** `src/app/register/manager/page.tsx`
*   **Correção:** Modificar a função `handleLegalAccept` para sanitizar os dados antes do envio:
    *   Remover caracteres não numéricos de `mobilePhone` (ex: `(11) 99999-9999` -> `11999999999`).
    *   Remover caracteres não numéricos de `postalCode` (ex: `00000-000` -> `00000000`).
    *   Enviar `birthDate` como `undefined` caso esteja vazio (evita erro de formato de data).

## 2. Correção da Visibilidade do Modal

**Diagnóstico:**
O componente `LegalConsentModal` utiliza classes de animação (`animate-in fade-in`) que dependem do plugin `tailwindcss-animate`, o qual **não está instalado** no projeto (`package.json`). Isso pode fazer com que o modal inicie com opacidade 0 e nunca transicione para visível.

**Ações Planejadas:**
*   **Arquivo:** `src/components/auth/LegalConsentModal.tsx`
*   **Correção:** Remover as classes `animate-in fade-in` do container principal e do conteúdo interno para garantir que o modal seja renderizado visivelmente sem depender de plugins ausentes.

## 3. Validação
Após as alterações, realizarei a verificação manual (simulada) para garantir que o código foi ajustado conforme o plano.

Deseja que eu prossiga com essas alterações?
