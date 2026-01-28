# 🚀 SOLUÇÃO RÁPIDA - RODAR MOBILE AGORA

**Problema:** `workspace:*` não é suportado por npm/yarn v1  
**Solução:** Usar os scripts da raiz ou instalar com pnpm

---

## ✅ OPÇÃO 1: Usar Script da Raiz (MAIS RÁPIDO!)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode

# Executar o script de dev do mobile que já está configurado
npm run food:dev
```

Esse comando usa o script do `package.json` raiz que roda `expo start` no ambra-food.

---

## ✅ OPÇÃO 2: Instalar PNPM (Recomendado)

PNPM suporta `workspace:*` nativamente!

```powershell
# 1. Instalar pnpm globalmente
npm install -g pnpm

# 2. Ir para raiz do projeto
cd C:\Users\Usuário\Documents\AmbraCode

# 3. Instalar dependências
pnpm install

# 4. Rodar mobile
cd apps\ambra-food
npx expo start --clear
```

---

## ✅ OPÇÃO 3: Reverter para NPM Normal

Se os scripts da raiz não funcionarem, reverta o `workspace:*`:

**NÃO FAÇA ISSO** - Já tentamos e não funcionou porque o npm encontra workspace:* em algum cache ou no package.json da raiz.

---

## ✅ OPÇÃO 4: Rodar Backend + Mobile Manualmente

### Terminal 1 - Backend

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\backend

# Matar processos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Rodar backend
npm run start:dev
```

### Terminal 2 - Mobile (Aguarde o backend subir primeiro)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode

# Tentar o script da raiz
npm run food:dev

# Se não funcionar, tente:
cd apps\ambra-food
node --version  # Verificar se Node >= 18
npm --version   # Verificar versão npm

# Instalar expo-cli globalmente
npm install -g expo-cli

# Rodar
expo start --clear
```

---

## 🐛 SE NADA FUNCIONAR

Execute MANUALMENTE no PowerShell **fora do Cursor**:

```powershell
# 1. Limpar tudo
cd C:\Users\Usuário\Documents\AmbraCode
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\*\node_modules -ErrorAction SilentlyContinue

# 2. Instalar PNPM
npm install -g pnpm

# 3. Instalar com PNPM
pnpm install

# 4. Rodar mobile
cd apps\ambra-food
npx expo start --clear
```

---

## 📊 VERIFICAR VERSÕES

```powershell
node --version   # Deve ser >= 18
npm --version    # Deve ser >= 9
```

Se npm < 9, atualize:
```powershell
npm install -g npm@latest
```

---

## 🎯 PRÓXIMA AÇÃO RECOMENDADA

**Execute no PowerShell (fora do Cursor):**

```powershell
cd C:\Users\Usuário\Documents\AmbraCode
npm run food:dev
```

Se não funcionar, instale pnpm:

```powershell
npm install -g pnpm
pnpm install
cd apps\ambra-food
npx expo start --clear
```

---

**Backend já está OK (sem erros Redis)!** 🎉  
**Só falta rodar o mobile!** 📱
