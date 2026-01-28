# 🚀 EXECUTE AGORA - MOBILE

**Correção Aplicada:** ✅ Script `dev` adicionado ao `package.json` do ambra-food

---

## 📱 COMANDO FINAL:

```powershell
cd C:\Users\Usuário\Documents\AmbraCode
npm run food:dev
```

**Isso vai:**
1. Limpar cache do Metro (`--clear`)
2. Iniciar servidor Expo
3. Mostrar QR Code para escanear

---

## 🎯 ALTERNATIVA (Se o comando acima não funcionar):

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
npx expo start --clear
```

---

## ✅ QUANDO FUNCIONAR:

Você vai ver algo assim:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.15.9:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

**Escaneie o QR Code com o Expo Go!** 📱

---

## 🐛 SE DER ERRO DE MÓDULO:

Se aparecer erro de `@nodum/shared` não encontrado:

```powershell
cd C:\Users\Usuário\Documents\AmbraCode

# Instalar pnpm (suporta workspace)
npm install -g pnpm

# Instalar dependências
pnpm install

# Rodar mobile
npm run food:dev
```

---

## 📊 CHECKLIST ANTES DE TESTAR:

- [x] Backend rodando em `http://192.168.15.9:3333`
- [x] Script `dev` adicionado ao ambra-food
- [x] Metro configurado para monorepo
- [x] Expo Go instalado no celular
- [x] Celular e PC na mesma rede Wi-Fi

---

**AGORA EXECUTE:** `npm run food:dev` 🚀
