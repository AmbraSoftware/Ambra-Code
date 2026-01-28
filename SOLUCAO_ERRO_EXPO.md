# 🔧 SOLUÇÃO - Erro "Body has already been read"

**Erro:** `TypeError: Body is unusable: Body has already been read`

**Causa:** Expo CLI tenta validar versões de dependências e falha ao consumir a resposta HTTP duas vezes.

---

## ✅ SOLUÇÃO APLICADA

Adicionei flag `--offline` ao script para pular validação de rede:

```json
"dev": "expo start --clear --offline"
```

---

## 🚀 EXECUTE NOVAMENTE:

```powershell
npm run food:dev
```

---

## 🎯 ALTERNATIVAS (SE AINDA FALHAR):

### Opção 1: Limpar Cache do Expo

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food

# Limpar cache Expo
npx expo start --clear --offline

# OU limpar tudo
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --offline
```

### Opção 2: Atualizar Expo CLI

```powershell
npm install -g expo-cli@latest
npm run food:dev
```

### Opção 3: Usar npx diretamente

```powershell
cd apps\ambra-food
npx expo start --clear --offline --tunnel
```

---

## 🐛 SE PERSISTIR:

Desabilite validação de dependências:

```powershell
# Criar .env no ambra-food
echo "EXPO_NO_DOTENV=1" > .env.local

# Rodar novamente
npm run food:dev
```

---

**Execute agora:** `npm run food:dev` 🚀
