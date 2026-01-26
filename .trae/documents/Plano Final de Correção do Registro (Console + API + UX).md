# Plano de Correção Definitiva e Excelência no Registro

Este plano visa erradicar os erros de console ("Uncontrolled to Controlled"), resolver o erro 400 (Bad Request) e corrigir a UX do modal de termos, garantindo um fluxo de cadastro perfeito.

## 1. Correção do Erro "Uncontrolled to Controlled" (Console)

**Diagnóstico Confirmado:**
Em `src/app/register/page.tsx`, o `useForm` inicializa com `defaultValues` apenas para `profileType` e `termsAccepted`. Campos como `name`, `taxId`, `mobilePhone`, etc., iniciam como `undefined`. Quando o usuário digita (ou o `Controller` renderiza), o valor passa a ser definido, disparando o erro do React.

**Ação:**
*   **Arquivo:** `src/app/register/page.tsx`
*   **Implementação:** Preencher o objeto `defaultValues` do `useForm` com strings vazias (`''`) para **todos** os campos do formulário (`name`, `email`, `password`, `confirmPassword`, `entityName`, `taxId`, `mobilePhone`, `postalCode`, `address`, `addressNumber`, `birthDate`).

## 2. Correção do Erro 400 (Bad Request)

**Diagnóstico Confirmado:**
O `onSubmit` atual em `src/app/register/page.tsx` já usa `masks.removeMask` para `taxId`, `mobilePhone` e `postalCode`. No entanto, ele envia `birthDate: data.birthDate || ''`. Se o backend espera uma data válida (ISO) ou `null`/`undefined`, enviar string vazia pode causar erro 400 (dependendo da validação do backend, que rejeita data vazia se o campo for esperado).
Além disso, `planId` não está sendo enviado neste arquivo, o que pode ser obrigatório pelo backend.

**Ação:**
*   **Arquivo:** `src/app/register/page.tsx`
*   **Implementação:**
    *   Sanitizar rigorosamente os dados numéricos (garantir que `masks.removeMask` deixe apenas dígitos).
    *   Enviar `birthDate: data.birthDate || undefined` (ou `null`) em vez de `''`.
    *   Incluir `planId: 'standard'` (ou similar) no payload para garantir consistência com a correção anterior do outro arquivo de registro.
    *   Adicionar validação de pré-envio (length check) dentro do `onSubmit` para garantir que dados incompletos não cheguem à API.

## 3. Correção do Modal de Termos (UX)

**Diagnóstico Confirmado:**
Os botões `onClick` foram inseridos no JSX (comentário `TODO`), mas a lógica de estado e o componente do modal ainda não foram implementados neste arquivo.

**Ação:**
*   **Arquivo:** `src/app/register/page.tsx`
*   **Implementação:**
    *   Importar `LegalConsentModal` de `@/components/auth/LegalConsentModal`.
    *   Adicionar estado: `const [legalModalOpen, setLegalModalOpen] = useState<{isOpen: boolean, tab: 'terms' | 'privacy'}>({isOpen: false, tab: 'terms'});`.
    *   Implementar os handlers `openModal('terms')` e `openModal('privacy')`.
    *   Renderizar o `<LegalConsentModal ... />` condicionalmente.

## 4. Validação

**Ação:**
*   Executar o teste E2E atualizado para confirmar a correção total.

Deseja autorizar a execução deste plano?
