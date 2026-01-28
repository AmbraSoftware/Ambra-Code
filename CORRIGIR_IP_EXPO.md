# 🔧 CORREÇÃO - Expo Usando Localhost

**Problema:** Expo está usando `127.0.0.1` ao invés do IP local  
**Erro:** "Failed to download remote update"

**Causa:** Celular não consegue acessar `localhost` do PC

---

## ✅ SOLUÇÃO APLICADA

Adicionei flag `--lan` para forçar uso do IP local:

```json
"dev": "expo start --clear --offline --lan"
```

---

## 🔄 REINICIE O EXPO:

```powershell
# No terminal do Expo, pressione Ctrl+C

# Depois execute novamente:
npm run food:dev
```

---

## 📱 AGORA DEVE APARECER:

```
› Metro waiting on exp://192.168.15.9:8081
```

**NÃO `127.0.0.1`!** ✅

---

## 🎯 SE AINDA DER ERRO:

### Opção 1: Modo Túnel (mais lento mas funciona sempre)

```powershell
cd apps\ambra-food
npx expo start --tunnel
```

### Opção 2: Verificar Firewall

```powershell
# Permitir Node.js no Firewall
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

### Opção 3: Conectar via IP Manualmente

No Expo Go:
1. Clicar em "Enter URL manually"
2. Digitar: `exp://192.168.15.9:8081`

---

## ✅ CHECKLIST:

- [ ] Ctrl+C para parar o Expo
- [ ] `npm run food:dev` para reiniciar
- [ ] Verificar se aparece IP `192.168.15.9` (NÃO `127.0.0.1`)
- [ ] Escanear QR Code novamente
- [ ] Celular e PC na mesma Wi-Fi

---

**Reinicie agora:** Ctrl+C → `npm run food:dev` 🔄
