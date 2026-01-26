# Skill: Run E2E Tests (Playwright)
Description: Executa testes E2E com Playwright de forma otimizada e focada.

## Trigger
Use quando o usuário pedir para "testar o fluxo", "rodar testes e2e", "validar login" ou "testar cadastro".

## Actions
1. **Identificar App**: Verifique qual app web está sendo testado (`ambra-flow` ou `ambra-console`).
2. **Comando Base**: `npx playwright test`.
3. **Otimizações**:
   - **Filtro**: Se o usuário mencionou um fluxo específico (ex: "login"), rode apenas esse arquivo: `npx playwright test tests/e2e/login.spec.ts`.
   - **UI Mode**: Se o usuário estiver depurando, sugira `--ui`.
   - **Project**: Se necessário, especifique o navegador: `--project=chromium`.
4. **Execução**:
   - Rode o comando no diretório do app correto.
   - Analise a saída. Se falhar, ofereça para ver o report ou debuggar.
