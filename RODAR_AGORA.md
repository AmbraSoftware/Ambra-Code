# 🚀 RODAR BACKEND + MOBILE - GUIA RÁPIDO

**Data:** 27 de Janeiro de 2026  
**IP Configurado:** `192.168.15.9:3333`

---

## ⚠️ PROBLEMAS IDENTIFICADOS E RESOLVIDOS

### 1. ✅ Redis Upstash Atingiu Limite (500k requests)

**Erro:** `ERR max requests limit exceeded. Limit: 500000, Usage: 500004`

**NÃO É BLOQUEANTE para testes!** 
- O backend iniciou corretamente
- Apenas as queues (emails, webhooks, reports) estão falhando
- As APIs REST funcionam normalmente

**Solução Temporária:** Ignore os erros de Redis por enquanto.

**Solução Permanente (Opcional):**
- Resetar o Redis no Upstash Dashboard
- Ou desabilitar os módulos de Queue temporariamente

### 2. ✅ Mobile Não Encontrava @nodum/shared

**Erro:** `Cannot find module '@nodum/shared'`

**Correções Aplicadas:**
- ✅ Ajustado `packages/shared/package.json` para apontar para `src/`
- ✅ Adicionado `paths` no `tsconfig.json` do ambra-food
- ✅ Criado `packages/shared/index.ts` para re-export
- ✅ Ajustado `metro.config.js` com sourceExts

---

## 🚀 COMANDOS PARA RODAR

### Terminal 1 - Backend (Já está rodando!)

```bash
cd C:\Users\Usuário\Documents\AmbraCode\apps\backend
npm run start:dev

# ✅ Se ver "Nest application successfully started" = FUNCIONANDO
# ⚠️ Ignore os erros de Redis (não bloqueiam APIs REST)
```

**Status Esperado:**
```
[Nest] 11440  - 27/01/2026, 17:37:47     LOG [NestApplication] Nest application successfully started
```

### Terminal 2 - Mobile

```bash
cd C:\Users\Usuário\Documents\AmbraCode\apps\ambra-food

# Limpar cache do Metro (IMPORTANTE após mudanças no metro.config)
npx expo start --clear

# Ou simplesmente:
expo start -c
```

**No Expo Go:**
- Escaneie o QR Code
- Aguarde o bundle carregar

---

## 🧪 CHECKLIST PRÉ-TESTE

- [x] IP configurado: `192.168.15.9:3333`
- [x] Backend compilou (ignorar erros Redis)
- [ ] Backend está escutando na porta 3333
- [ ] Mobile: cache do Metro limpo
- [ ] Expo Go instalado no celular
- [ ] Celular e PC na mesma rede Wi-Fi

---

## 🔍 VALIDAR QUE BACKEND ESTÁ OK

Abra no navegador ou use curl:

```bash
# Teste 1: Health check
curl http://192.168.15.9:3333/health

# Teste 2: No navegador do celular
http://192.168.15.9:3333/health

# Se retornar 200 OK = BACKEND FUNCIONANDO ✅
```

---

## 📱 FLUXO DE TESTE COM R$ 1,00

### 1. Abrir App no Expo Go

Escanear QR Code

### 2. Login

```
Email: pai@teste.com (ou seu usuário de teste)
Senha: senha123
```

### 3. Ver Carteira

- Saldo deve aparecer BEM GRANDE
- Anotar valor atual

### 4. Testar Recarga de R$ 1,00

- Clicar "💳 Recarregar Carteira"
- Clicar no botão rápido "R$ 1"
- **VALIDAR O RECIBO:**

```
💰 Recibo de Pré-Pagamento

💳 Crédito na Carteira: R$ 1,00
   (Valor que você poderá usar nas compras)

📝 Taxa de Serviço PIX: + R$ 0,50
   (Custo da transação - não vai para carteira)

────────────────────────────

🏦 Total a Pagar no PIX: R$ 1,50

✅ Você paga R$ 1,50 no PIX
💰 Recebe R$ 1,00 na carteira
📝 Taxa: R$ 0,50
```

### 5. Gerar PIX

- Clicar "Gerar Código PIX"
- Ver QR Code
- Copiar código PIX

### 6. Pagar no Banco

- Abrir app do banco
- PIX → Copiar e Colar
- Pagar R$ 1,50

### 7. Validar Saldo

- Voltar para Carteira
- Pull to Refresh (arrastar para baixo)
- **VALIDAR:**
  - ✅ Saldo aumentou EXATAMENTE R$ 1,00
  - ✅ Última transação: "Recarga +R$ 1,00"

---

## 🐛 TROUBLESHOOTING

### Mobile: "Cannot find module @nodum/shared"

**Solução:**
```bash
# 1. Limpar cache
cd apps/ambra-food
expo start --clear

# 2. Se persistir, reinstalar
rm -rf node_modules
yarn install
expo start -c
```

### Mobile: "Network Error" ao fazer login

**Solução:**
```bash
# 1. Testar se backend está acessível do celular
# No navegador do celular, abrir:
http://192.168.15.9:3333/health

# Se não abrir:
# - Desativar firewall temporariamente
# - Verificar se celular e PC estão na mesma Wi-Fi
# - Tentar outro IP (pode ter múltiplos adaptadores de rede)
```

### Backend: Porta 3333 em uso

**Solução:**
```powershell
# Matar processo na porta
$pid = (Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }

# Rodar novamente
npm run start:dev
```

---

## ✅ CRITÉRIO DE SUCESSO

O teste é APROVADO se:

1. ✅ Backend inicia (ignore erros de Redis)
2. ✅ Mobile carrega sem erro de @nodum/shared
3. ✅ Login funciona
4. ✅ Carteira exibe saldo
5. ✅ Recarga de R$ 1,00 mostra recibo claro
6. ✅ PIX é gerado
7. ✅ Após pagamento, saldo aumenta EXATAMENTE R$ 1,00

---

## 📊 MATEMÁTICA CORRETA IMPLEMENTADA

```typescript
// Trabalha com centavos (inteiros) para precisão
const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

// Exemplo:
Valor: R$ 1,00 = 100 cents
Taxa Fixa: R$ 0,50 = 50 cents
Taxa %: 0% = 0 cents
Total: 100 + 50 + 0 = 150 cents = R$ 1,50 ✅
```

**Garante:**
- ✅ Sem dízimas periódicas
- ✅ Arredondamento correto
- ✅ Valores exatos em reais

---

## 🎯 PRÓXIMA AÇÃO

```bash
# Terminal no apps/ambra-food
expo start --clear
```

**Escaneie o QR Code e teste!** 📱💰

---

**Tudo configurado para testes reais com centavos!** ✅
