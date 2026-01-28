# 📱 Ambra Food - App Mobile (MVP)

**App dos Pais/Alunos** - React Native + Expo + TypeScript + NativeWind

---

## 🎯 ESCOPO DO MVP IMPLEMENTADO

### ✅ 3 Missões Críticas (Foco em Receita):

1. **Autenticação** 
   - Login com `GUARDIAN` ou `STUDENT`
   - Validação de roles permitidos
   - Armazenamento seguro de JWT

2. **Carteira (Wallet)**
   - Saldo GRANDE e destacado
   - Últimas 5 transações
   - Indicadores de limite diário e crédito
   - Alertas de saldo negativo/bloqueio

3. **Recarga (Cash-In via PIX)**
   - Input de valor com validação
   - Cálculo automático de taxas
   - Geração de QR Code PIX
   - Código copiável para pagamento

---

## 📁 ESTRUTURA CRIADA

```
apps/ambra-food/
├── metro.config.js          ✨ Configurado para monorepo
├── package.json             ✨ Adicionado @nodum/shared
├── types/                   ✨ NOVO
│   ├── auth.types.ts       # AuthResponse, UserProfile
│   ├── wallet.types.ts     # Wallet, Transaction
│   ├── payment.types.ts    # RechargeDto, PixRechargeResponse, CashInFees
│   └── index.ts            # Barrel export
├── services/
│   └── api.ts              ✨ Atualizado com tipos e métodos específicos
├── app/
│   ├── (auth)/
│   │   └── login.tsx       ✨ Refatorado com LoginDto do shared
│   └── (tabs)/
│       ├── _layout.tsx     ✨ Wallet como primeira tab
│       ├── wallet.tsx      ✨ NOVO - Tela principal da carteira
│       └── wallet-recharge.tsx ✨ NOVO - Fluxo de recarga PIX
```

---

## 🛠️ CONFIGURAÇÃO PARA RODAR

### 1. Instalar Dependências

```bash
cd apps/ambra-food
yarn install
# ou
npm install
```

### 2. Configurar IP do Backend

**⚠️ CRÍTICO:** Edite o arquivo `services/api.ts`:

```typescript
// Linha 15 - Substitua pelo IP da sua máquina
const API_BASE_URL = 'http://192.168.1.100:3333'; // ← SEU IP AQUI
```

**Como descobrir seu IP:**
- Windows: `ipconfig` (procure "IPv4 Address")
- Mac/Linux: `ifconfig` ou `ip addr`

### 3. Garantir que o Backend está Rodando

```bash
# No diretório apps/backend
npm run start:dev
```

Verifique se está acessível em `http://SEU_IP:3333/health`

### 4. Iniciar o App

```bash
# No diretório apps/ambra-food
expo start
```

Escolha uma opção:
- **Android:** Pressione `a` (requer Android Studio/Emulador)
- **iOS:** Pressione `i` (requer Xcode no Mac)
- **Expo Go:** Escaneie o QR Code no celular (app Expo Go)

---

## 🧪 COMO TESTAR

### Credenciais de Teste

Use um usuário criado no backend com role `GUARDIAN` ou `STUDENT`:

```
Email: pai@teste.com
Senha: senha123
```

### Fluxo de Teste Completo

1. **Login:**
   - Abra o app
   - Clique em "Entrar"
   - Digite email e senha
   - Verifique se redireciona para a tela de Carteira

2. **Ver Carteira:**
   - Veja o saldo atual (grande e centralizado)
   - Puxe para baixo para atualizar (Pull to Refresh)
   - Veja as últimas transações
   - Verifique limite diário e crédito

3. **Fazer Recarga:**
   - Clique no botão "💳 Recarregar Carteira"
   - Digite um valor (ex: 50)
   - Ou use os valores rápidos (R$ 20, 50, 100, 200)
   - Veja o resumo com taxas
   - Clique em "Gerar Código PIX"
   - **Resultado:**
     - QR Code exibido
     - Código copiável
     - Instruções de pagamento

---

## 🔧 ARQUITETURA TÉCNICA

### Integração com Monorepo

- ✅ Metro configurado para resolver `@nodum/shared`
- ✅ Usa `LoginDto` e enums do pacote compartilhado
- ✅ Tipos locais apenas para respostas de API

### Camada de API

```typescript
// services/api.ts

// 1. Cliente Axios base com interceptors
export const api = axios.create({ baseURL: API_BASE_URL });

// 2. Métodos tipados por domínio:
export const authAPI = {
  login: (credentials: LoginDto) => Promise<AuthResponse>
};

export const walletAPI = {
  getMyWallet: () => Promise<Wallet>
  getMyTransactions: () => Promise<Transaction[]>
};

export const paymentAPI = {
  createPixRecharge: (data: RechargeDto) => Promise<PixRechargeResponse>
  getCashInFees: () => Promise<CashInFees>
};
```

### Gestão de Estado

- **AsyncStorage:** Token JWT e dados do usuário
- **useState + useEffect:** Estado local das telas
- **Pull to Refresh:** Atualização manual dos dados

### Estilização

- **NativeWind 4.2.1:** Tailwind CSS para React Native
- **Cores do tema:**
  - Primary: `#4CAF50` (Verde)
  - Secondary: `#FF9800` (Laranja)
- **Componentes:** Lucide React Native para ícones

---

## 📊 ENDPOINTS CONSUMIDOS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/login` | Autenticação (retorna JWT) |
| `GET` | `/wallet/me` | Busca carteira do usuário |
| `GET` | `/wallet/me/transactions` | Últimas transações |
| `POST` | `/payment/recharge-request` | Gera PIX para recarga |
| `GET` | `/global-admin/cash-in-fees` | Taxas de recarga |

---

## 🚨 PROBLEMAS COMUNS

### 1. "Network Error" ao fazer login

**Causa:** IP do backend está errado ou inacessível.

**Solução:**
```bash
# 1. Verifique se o backend está rodando
curl http://SEU_IP:3333/health

# 2. Teste no navegador do celular
# Abra: http://SEU_IP:3333/health
# Se não abrir, problema de rede/firewall

# 3. Ajuste o IP em services/api.ts
```

### 2. "Cannot find module '@nodum/shared'"

**Causa:** Metro não está resolvendo o monorepo.

**Solução:**
```bash
# 1. Limpe o cache do Metro
expo start -c

# 2. Reinstale dependências
yarn install

# 3. Verifique metro.config.js
```

### 3. QR Code não aparece

**Causa:** Backend não está retornando `qrCode` em base64.

**Solução temporária:** Use apenas o código "Copia e Cola" (`pixCopyPaste`).

**Solução definitiva:** Implemente geração de QR Code no backend ou use biblioteca React Native para gerar localmente a partir do payload PIX.

---

## 🚀 PRÓXIMOS PASSOS (Pós-MVP)

### Features Essenciais:

1. **Seleção de Dependentes (GUARDIAN com múltiplos filhos)**
   - Lista de alunos vinculados
   - Recarregar para filho específico

2. **Histórico Completo de Transações**
   - Filtros por data, tipo
   - Paginação

3. **Notificações Push**
   - Recarga confirmada
   - Compra realizada
   - Saldo baixo

4. **Catálogo de Produtos (Cantina)**
   - Listar produtos disponíveis
   - Adicionar ao carrinho
   - Checkout

5. **Pedidos (Merenda)**
   - Agendar refeições
   - Ver histórico de pedidos

### Melhorias Técnicas:

- Context API/Zustand para estado global
- React Query para cache de dados
- Formulários com validação (React Hook Form)
- Testes E2E (Detox)
- CI/CD para builds automáticos

---

## 📝 NOTAS IMPORTANTES

### Segurança:

- ✅ JWT armazenado em AsyncStorage (criptografado)
- ✅ Interceptor injeta token automaticamente
- ✅ Auto-logout em 401 (token expirado)
- ⚠️ TODO: Implementar refresh token

### Performance:

- ✅ Pull to Refresh implementado
- ✅ Loading states em todas as requisições
- ⚠️ TODO: Debounce em inputs de busca
- ⚠️ TODO: Lazy loading de listas longas

### UX:

- ✅ Saldo BEM GRANDE e visível
- ✅ Botão de recarga destacado
- ✅ Feedback visual (loading, success, error)
- ✅ Valores rápidos para recarga
- ⚠️ TODO: Animações de transição

---

## 👨‍💻 DESENVOLVIDO POR

**Cursor AI Agent** + **Trae (Usuário)**

**Data:** 27 de Janeiro de 2026

**Stack:** React Native + Expo + TypeScript + NativeWind + @nodum/shared

**Arquitetura:** Monorepo com Metro configurado para workspace protocol

**Backend:** NestJS + Prisma + PostgreSQL (Supabase)

---

## 📧 SUPORTE

Problemas ou dúvidas? Entre em contato com a equipe de desenvolvimento.

**Documentos relacionados:**
- `AMBRA_CONTEXT.md` - Contexto do projeto
- `apps/backend/README.md` - Documentação do backend
- `packages/shared/README.md` - DTOs e enums compartilhados

---

✅ **MVP PRONTO PARA TESTES!** 🎉
