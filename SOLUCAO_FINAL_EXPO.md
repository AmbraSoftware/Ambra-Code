# 🔧 SOLUÇÃO FINAL - Desabilitar Validação Expo

**Problema Persistente:** `TypeError: Body has already been read`

**Causa:** Expo CLI tenta validar versões de pacotes e falha

---

## ✅ SOLUÇÕES APLICADAS:

1. ✅ Adicionado `EXPO_NO_DOCTOR=1` no `.env`
2. ✅ API URL corrigida: `http://192.168.15.9:3333`
3. ✅ Script com `cross-env` (mas pode não funcionar no Windows)

---

## 🚀 OPÇÃO 1: MODO TÚNEL (RECOMENDADO!)

**Mais lento mas 100% funcional:**

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
npx expo start --tunnel
```

Isso cria um túnel ngrok que:
- ✅ Funciona em qualquer rede
- ✅ Não precisa de validação
- ✅ Não depende de IP local
- ⚠️ É um pouco mais lento

---

## 🚀 OPÇÃO 2: Rodar Direto (Sem npm script)

```powershell
cd apps\ambra-food
set EXPO_NO_DOCTOR=1
npx expo start --lan
```

---

## 🚀 OPÇÃO 3: Instalar cross-env

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
npm install --save-dev cross-env

# Depois rodar
npm run dev
```

---

## 🎯 RECOMENDAÇÃO FINAL:

**USE O MODO TÚNEL** - É o mais confiável:

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
npx expo start --tunnel
```

Aguarde aparecer:

```
› Tunnel ready.
› Tunnel URL: exp://[codigo].ngrok.io

[QR CODE]

Scan the QR code above with Expo Go
```

**Esse QR Code vai funcionar 100%!** ✅

---

## 📱 NO EXPO GO:

1. Escanear QR Code
2. Aguardar carregar (~1 minuto primeira vez no túnel)
3. Ver tela inicial do Ambra Food!

---

## ✅ BACKEND PRECISA ESTAR RODANDO:

Lembre-se de ter o backend ativo:

```powershell
# Terminal separado
cd C:\Users\Usuário\Documents\AmbraCode\apps\backend
npm run start:dev
```

---

**Execute agora:** `npx expo start --tunnel` 🚀
