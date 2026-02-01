# Documentação (docs/)

Este diretório contém a documentação oficial do monorepo Ambra.

## Estrutura

### `business/` — Dinheiro e Estratégia
Documentos voltados a decisões de negócio.
- `financial/`: ROI, pricing, unit economics, taxas, políticas de refund.
- `strategy/`: one-pager, pitch, visão e direcionamento de longo prazo.
- `legal/`: compliance, CDC, termos de uso e políticas (quando aplicável).

### `tech/` — Manuais e Arquitetura
Documentos técnicos para engenharia e operação.
- `architecture/`: decisões arquiteturais, fluxos, banco, diagramas.
- `guides/`: guias de setup, deploy e operação.
- `security/`: auditorias, boas práticas e referências de segurança.
- `apps/`: documentação específica por aplicação.

### `features/` — O que estamos fazendo
Organização do ciclo de vida do produto.
- `planned/`: backlog e specs futuras.
- `implemented/`: funcionalidades já implementadas (contratos, rotas e regras vigentes).
- `frozen/`: icebox (pausadas/descartadas).

### `legacy/` — O que já fizemos (Arquivo morto)
Histórico e artefatos antigos mantidos por rastreabilidade. Evite adicionar conteúdo novo aqui.

## Convenções
- Prefira nomes de arquivos em `UPPER_SNAKE_CASE.md` para documentos “core”.
- Para docs por app, mantenha subpastas em `tech/apps/<app>/`.
- Credenciais reais não devem estar no git. Se existir algo sensível, mova para `legacy/SENSITIVE/` e agende rotação/remoção.
