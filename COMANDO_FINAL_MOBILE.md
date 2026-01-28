# 🎯 COMANDO FINAL - MOBILE FUNCIONANDO

**Problema:** Expo CLI insiste em validar dependências e falha

**Solução:** Scripts criados para forçar variáveis de ambiente

---

## 🚀 OPÇÃO 1: Script PowerShell (RECOMENDADO!)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
.\start-expo.ps1
```

Se der erro de "execução de scripts desabilitada":

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-expo.ps1
```

---

## 🚀 OPÇÃO 2: Script Batch (Windows)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
.\start-expo.bat
```

---

## 🚀 OPÇÃO 3: Comando Manual

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food

$env:EXPO_NO_DOCTOR="1"
$env:EXPO_OFFLINE="1"

npx expo start --host 192.168.15.9 --port 8081
```

---

## 📱 CONECTAR NO EXPO GO

Quando o Expo iniciar, **NÃO vai mostrar QR Code** (modo offline).

### Conectar Manualmente:

1. **Abrir Expo Go** no celular
2. **Clicar "Enter URL manually"**
3. **Digitar:**
   ```
   exp://192.168.15.9:8081
   ```
4. **Aguardar carregar**

---

## 🎯 FLUXO COMPLETO:

### 1. Backend (Terminal 1)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\backend
npm run start:dev
```

Aguarde ver: `Nest application successfully started`

### 2. Mobile (Terminal 2)

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food
.\start-expo.bat
```

Aguarde ver: `Metro waiting on...`

### 3. Celular

1. Abrir **Expo Go**
2. Clicar **"Enter URL manually"**
3. Digitar: `exp://192.168.15.9:8081`
4. Aguardar bundle carregar (~30 segundos)

---

## ✅ QUANDO FUNCIONAR:

Você vai ver:

```
┌──────────────────┐
│                  │
│      ( AF )      │
│   Ambra Food     │
│                  │
│  [  Entrar  ]    │
│  [Criar Conta]   │
│                  │
└──────────────────┘
```

---

## 🧪 TESTE RÁPIDO:

1. **Login:** `pai@teste.com` / `senha123`
2. **Ver Carteira** (saldo grande e bem visível)
3. **Recarregar** → Clicar botão "R$ 1"
4. **Ver Recibo:**
   - 💳 Crédito: R$ 1,00
   - 📝 Taxa: R$ 0,50  
   - 🏦 Total: R$ 1,50
5. **Gerar PIX** e pagar no banco
6. **Validar:** Saldo +R$ 1,00 ✅

---

## 🐛 SE NÃO CONECTAR:

### Verificar Backend Acessível:

No navegador do celular, abrir:
```
http://192.168.15.9:3333/health
```

Se não abrir = problema de rede/firewall.

### Permitir Node.js no Firewall:

```powershell
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

---

## 📊 CHECKLIST FINAL:

- [ ] Backend rodando em `:3333`
- [ ] Mobile rodando em `:8081`
- [ ] Celular e PC na mesma Wi-Fi
- [ ] URL: `exp://192.168.15.9:8081`
- [ ] Backend acessível do celular

---

**Execute agora:** `.\start-expo.bat` 🚀📱
