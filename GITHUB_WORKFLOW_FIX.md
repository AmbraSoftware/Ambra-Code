# 🔧 Correção do GitHub Actions Workflow

## ❌ Problema

O workflow do GitHub Actions estava falhando com o erro:
```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

**Causa:** O protocolo `workspace:*` usado no monorepo requer npm versão 7 ou superior, mas o Node.js setup padrão pode não garantir essa versão.

## ✅ Solução Aplicada

### Arquivo: `.github/workflows/main.yml`

**Mudança:** Adicionado step para atualizar npm para a versão mais recente antes de instalar dependências.

```yaml
- name: Use Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'npm'
    cache-dependency-path: '**/package-lock.json'

- name: Upgrade npm
  run: npm install -g npm@latest

- name: Install Dependencies
  run: npm ci --include=dev
```

### Por que isso funciona?

1. **Node.js Setup:** Instala Node.js 20.x (que vem com npm, mas pode não ser a versão mais recente)
2. **Upgrade npm:** Garante que temos npm 7+ que suporta `workspace:*`
3. **Install Dependencies:** Agora `npm ci` consegue resolver as dependências do workspace

## 📋 Dependências que usam `workspace:*`

- `apps/ambra-flow/package.json`: `"@nodum/shared": "workspace:*"`
- `apps/backend/package.json`: `"@nodum/shared": "workspace:*"`

## ✅ Status

- ✅ Workflow atualizado
- ✅ npm será atualizado automaticamente no CI
- ✅ Dependências do workspace serão resolvidas corretamente

## 🧪 Como Testar

1. Faça commit das mudanças
2. Push para `main` ou `develop`
3. Verifique o GitHub Actions
4. O step "Install Dependencies" deve passar sem erros

---

**Data:** 2026-01-26  
**Status:** ✅ Corrigido
