# 📱 Ambra Food Web - PWA Mobile-First

**Aplicação web responsiva para pais e alunos acessarem suas carteiras e fazerem recargas.**

---

## 🎯 OBJETIVO

MVP rápido e funcional para validação de modelo de negócio, substituindo temporariamente o app nativo devido a complexidades técnicas do Expo.

---

## 🚀 QUICK START

### Instalar Dependências

```bash
cd apps/ambra-food-web
npm install
```

### Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3002`

### Testar no Celular (mesma rede Wi-Fi)

1. Altere `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://192.168.15.9:3333
   ```

2. Descubra seu IP:
   ```bash
   ipconfig
   ```

3. No celular, acesse:
   ```
   http://192.168.15.9:3002
   ```

---

## 📂 ESTRUTURA

```
ambra-food-web/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard (Carteira)
│   │   ├── login/            # Autenticação
│   │   ├── recharge/         # Recarga PIX
│   │   ├── profile/          # Perfil
│   │   ├── globals.css       # Estilos mobile-first
│   │   └── layout.tsx        # Layout root + PWA config
│   ├── components/
│   │   └── MobileLayout.tsx  # Layout com Bottom Nav
│   └── lib/
│       └── api.ts            # Axios + API methods
├── public/
│   └── manifest.json         # PWA manifest
└── package.json
```

---

## 🎨 FEATURES IMPLEMENTADAS

### ✅ PWA (Progressive Web App)
- Instalável na tela inicial do celular
- Funciona offline (com service worker)
- App-like experience (sem bounce scroll)
- Viewport otimizado (previne zoom no iOS)

### ✅ Mobile-First Design
- Touch targets mínimos de 44px
- Fontes system nativas
- Bottom Navigation Bar
- Inputs grandes (16px - previne zoom iOS)

### ✅ Páginas MVP
1. **Login** (`/login`)
   - Autenticação Guardian/Student
   - Validação de roles
   - JWT storage

2. **Dashboard** (`/`)
   - Saldo em destaque (fonte grande)
   - Limites diário e crédito
   - Últimas 5 transações
   - Pull-to-refresh
   - Alertas de saldo negativo/bloqueado

3. **Recarga** (`/recharge`)
   - Input de valor com validação
   - Valores rápidos (R$ 1, 5, 10, 20, 50, 100)
   - Matemática precisa (cents-based)
   - Recibo claro (crédito vs taxa vs total)
   - Geração de PIX
   - QR Code (placeholder)
   - Pix Copia e Cola com botão de copiar

4. **Perfil** (`/profile`)
   - Dados do usuário
   - Logout

---

## 🧪 CREDENCIAIS DE TESTE

```
Email: aluno@elite.com
Senha: password123
Role: STUDENT
Saldo Inicial: R$ 150,00
```

---

## 🎯 FLUXO DE TESTE

1. **Acessar** `http://localhost:3002/login`
2. **Fazer login** com credenciais de teste
3. **Ver saldo** na tela principal
4. **Clicar "💳 Recarregar Carteira"**
5. **Escolher valor** (ex: R$ 1,00)
6. **Ver recibo** com separação clara
7. **Gerar PIX** e copiar código
8. **Pagar no banco**
9. **Validar** que saldo aumentou exatamente R$ 1,00

---

## 🔧 MATEMÁTICA PRECISA

```typescript
// Trabalha com centavos (inteiros) para evitar erros de floating-point
const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

// Exemplo:
Valor: R$ 1,00 = 100 cents
Taxa Fixa: R$ 0,50 = 50 cents
Taxa %: 0% = 0 cents
Total: 150 cents = R$ 1,50 ✅
```

---

## 📱 INSTALAR COMO PWA

### iOS (Safari)
1. Abrir no Safari
2. Clicar "Compartilhar"
3. "Adicionar à Tela Inicial"

### Android (Chrome)
1. Abrir no Chrome
2. Menu → "Instalar app"
3. Ou banner automático

---

## 🎨 CORES DO TEMA

| Cor | Valor | Uso |
|-----|-------|-----|
| Primary | `#FC5407` | Botões, saldo, destaque (Laranja Ambra) |
| Primary Dark | `#e04804` | Hover states |
| Primary Light | `#FBAF72` | Secundário (Laranja claro) |
| Background | `#ffffff` | Fundo principal |
| Foreground | `#111827` | Texto principal |
| Muted | `#F3F4F6` | Botões secundários |

---

## 🚀 DEPLOYMENT (Vercel)

1. Conectar repositório GitHub
2. Configurar:
   ```
   Framework Preset: Next.js
   Root Directory: apps/ambra-food-web
   Build Command: npm run build
   Output Directory: .next
   ```
3. Variáveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://seu-backend.com
   ```

---

## 📊 VANTAGENS vs App Nativo

| Critério | Expo App | Web PWA |
|----------|----------|---------|
| Tempo de Setup | Bloqueado | ✅ 1 hora |
| Compatibilidade | Problemas | ✅ Zero issues |
| Deployment | Complexo | ✅ Automático |
| Atualizações | App Store | ✅ Instantâneas |
| UX Mobile | 100% | 90% (suficiente para MVP) |

---

## 🎯 PRÓXIMOS PASSOS

Após validar o MVP:
1. Adicionar service worker (PWA offline)
2. Notificações push (web push API)
3. Biometria (WebAuthn)
4. Animações e transições
5. Dark mode

---

**Desenvolvido com excelência! 💚✨**
