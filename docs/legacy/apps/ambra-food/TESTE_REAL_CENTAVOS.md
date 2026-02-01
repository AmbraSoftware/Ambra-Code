# 🧪 TESTE REAL COM CENTAVOS - Guia Completo

**Data:** 27 de Janeiro de 2026  
**Status:** ✅ **PRONTO PARA TESTES REAIS**

---

## ✅ MUDANÇAS IMPLEMENTADAS

### 1. Backend Corrigido

**Arquivos Modificados:**
- `apps/backend/src/modules/platform/coupons.service.ts`
  - ✅ Convertido `null` para `undefined` (TypeScript strict null checks)
- `apps/backend/src/modules/products/products.controller.ts`
  - ✅ Removido `UserRole.CANTEEN_OPERATOR` (não existe)
  - ✅ Substituído por roles corretos

**Comando para rodar:**
```bash
cd apps/backend
npm run start:dev
```

---

### 2. Mobile Preparado para Testes

#### A. Valor Mínimo Reduzido

**Antes:**
```typescript
if (value < 10) {
  Alert.alert('Erro', 'O valor mínimo para recarga é R$ 10,00.');
}
```

**Depois:**
```typescript
if (value < 0.50) {
  Alert.alert('Erro', 'O valor mínimo para recarga é R$ 0,50.');
}
```

#### B. Matemática Financeira Precisa

**PROBLEMA (JavaScript nativo):**
```javascript
10.00 + 1.15 = 11.149999999999999 ❌
```

**SOLUÇÃO (Trabalhar com centavos):**
```typescript
// Converte para centavos (inteiros)
const toCents = (value: number): number => Math.round(value * 100);
const fromCents = (cents: number): number => cents / 100;

// Exemplo:
const valueCents = toCents(10.00);    // 1000
const feeCents = toCents(1.15);       // 115
const totalCents = valueCents + feeCents; // 1115
const total = fromCents(totalCents);  // 11.15 ✅
```

**Fórmula Implementada:**
```typescript
Total = Valor + TaxaFixa + (Valor * TaxaPercent / 100)

// Com centavos:
TotalCents = ValorCents + TaxaFixaCents + round((ValorCents * Percent) / 100)
```

#### C. UI Clarificada (Recibo de Pré-Pagamento)

**ANTES (Confuso):**
```
Valor da recarga: R$ 1,00
Taxa PIX: R$ 0,50
Total a pagar: R$ 1,50
```

**DEPOIS (Cristalino):**
```
💰 Recibo de Pré-Pagamento

💳 Crédito na Carteira
   R$ 1,00
   Valor que você poderá usar nas compras

📝 Taxa de Serviço PIX
   + R$ 0,50
   Custo da transação (não vai para carteira)

────────────────────────────

🏦 Total a Pagar no PIX
   R$ 1,50

✅ Você paga R$ 1,50 no PIX
💰 Recebe R$ 1,00 na carteira
📝 Taxa: R$ 0,50
```

#### D. Valores Rápidos para Teste

**Antes:**
```typescript
[20, 50, 100, 200]
```

**Depois:**
```typescript
[1, 5, 10, 20, 50, 100] // ✅ Inclui R$ 1,00 para teste
```

---

## 🧪 ROTEIRO DE TESTE COMPLETO

### Pré-Requisitos:

- [x] Backend rodando em `http://SEU_IP:3333`
- [x] Mobile com IP configurado em `services/api.ts`
- [x] Expo Go instalado no celular
- [x] Usuário de teste criado (GUARDIAN ou STUDENT)
- [x] Taxas de recarga configuradas no Console

---

### TESTE 1: Recarga de R$ 1,00 (Com Taxa)

**Configuração de Taxas no Console:**
```
PIX:
- Custo Gateway: R$ 0,00
- Cobrar Cliente? SIM
- Taxa Fixa Cliente: R$ 0,50
- Taxa % Cliente: 0%
```

**Passo a Passo:**

1. **Login no App**
   - Email: pai@teste.com
   - Senha: senha123

2. **Ir para Carteira**
   - Ver saldo atual (anotar valor)

3. **Clicar em "Recarregar Carteira"**

4. **Digitar R$ 1,00** (ou clicar no botão "R$ 1")

5. **Verificar Recibo:**
   ```
   💳 Crédito na Carteira: R$ 1,00
   📝 Taxa de Serviço PIX: + R$ 0,50
   🏦 Total a Pagar no PIX: R$ 1,50
   ```

6. **Clicar "Gerar Código PIX"**

7. **Copiar código PIX**

8. **Pagar no app do banco** (R$ 1,50)

9. **Voltar para Carteira e atualizar** (Pull to Refresh)

10. **VALIDAÇÃO:**
    - ✅ Saldo aumentou exatamente R$ 1,00
    - ✅ Última transação mostra "Recarga: +R$ 1,00"
    - ✅ Matemática correta: Pagou R$ 1,50, recebeu R$ 1,00

---

### TESTE 2: Recarga de R$ 0,50 (Valor Mínimo)

**Passo a Passo:**

1. **Clicar em "Recarregar Carteira"**

2. **Digitar R$ 0,50**

3. **Verificar que aceita o valor** (não mostra erro de mínimo)

4. **Verificar Recibo:**
   ```
   💳 Crédito na Carteira: R$ 0,50
   📝 Taxa de Serviço PIX: + R$ 0,50 (se configurado)
   🏦 Total a Pagar: R$ 1,00
   ```

5. **Gerar PIX e pagar**

6. **VALIDAÇÃO:**
   - ✅ Saldo aumentou R$ 0,50
   - ✅ Matemática correta

---

### TESTE 3: Recarga de R$ 10,00 (Taxa Percentual)

**Configuração de Taxas:**
```
PIX:
- Taxa Fixa Cliente: R$ 1,00
- Taxa % Cliente: 2%
```

**Cálculo Esperado:**
```
Valor: R$ 10,00
Taxa Fixa: R$ 1,00
Taxa %: R$ 10,00 * 2% = R$ 0,20
Total: R$ 10,00 + R$ 1,00 + R$ 0,20 = R$ 11,20
```

**Passo a Passo:**

1. **Digitar R$ 10,00**

2. **Verificar Recibo:**
   ```
   💳 Crédito na Carteira: R$ 10,00
   📝 Taxa de Serviço PIX: + R$ 1,20
   🏦 Total a Pagar: R$ 11,20
   ```

3. **Gerar PIX e pagar R$ 11,20**

4. **VALIDAÇÃO:**
   - ✅ Saldo aumentou R$ 10,00
   - ✅ Taxa calculada corretamente: R$ 1,00 + R$ 0,20 = R$ 1,20

---

### TESTE 4: Recarga Sem Taxa (Taxa Absorvida)

**Configuração de Taxas:**
```
PIX:
- Cobrar Cliente? NÃO
- Cobrar Merchant? NÃO
```

**Passo a Passo:**

1. **Digitar R$ 5,00**

2. **Verificar Recibo:**
   ```
   💳 Crédito na Carteira: R$ 5,00
   📝 Taxa de Serviço PIX: + R$ 0,00 (não exibido se zero)
   🏦 Total a Pagar: R$ 5,00
   ```

3. **VALIDAÇÃO:**
   - ✅ Total = Valor (sem taxa extra)
   - ✅ Saldo aumenta R$ 5,00

---

## 🔍 VALIDAÇÕES DE MATEMÁTICA FINANCEIRA

### Cenários de Arredondamento:

#### Cenário 1: Decimal Simples
```
Valor: R$ 10,00
Taxa %: 2.5%
Cálculo: 10.00 * 0.025 = 0.25
Total: 10.25 ✅
```

#### Cenário 2: Dízima Periódica
```
Valor: R$ 100,00
Taxa %: 3.33%
Cálculo em centavos:
  - ValorCents = 10000
  - PercentCents = round(10000 * 3.33 / 100) = round(333.3) = 333
  - Total = 10000 + 333 = 10333 cents = R$ 103.33 ✅
```

#### Cenário 3: Múltiplas Taxas
```
Valor: R$ 50,00
Taxa Fixa: R$ 1,50
Taxa %: 2%
Cálculo em centavos:
  - ValorCents = 5000
  - FixaCents = 150
  - PercentCents = round(5000 * 2 / 100) = 100
  - TotalCents = 5000 + 150 + 100 = 5250
  - Total = R$ 52.50 ✅
```

---

## 🐛 PROBLEMAS POTENCIAIS E SOLUÇÕES

### Problema 1: "Dinheiro Sumiu"

**Sintoma:** Pai paga R$ 1,50 mas vê R$ 1,00 na carteira.

**Causa:** Não entendeu que R$ 0,50 foi taxa.

**Solução Implementada:**
- ✅ Recibo detalhado ANTES de pagar
- ✅ Nota explicativa clara
- ✅ Cores diferentes (verde = crédito, laranja = taxa)

### Problema 2: Arredondamento Incorreto

**Sintoma:** Total mostra R$ 10.149999999

**Causa:** JavaScript com ponto flutuante.

**Solução Implementada:**
- ✅ Matemática com centavos (inteiros)
- ✅ `Math.round()` em todas operações
- ✅ `fromCents()` apenas na exibição

### Problema 3: Backend Rejeita Valor

**Sintoma:** PIX gerado mas backend retorna erro.

**Causa:** Backend pode ter validação de mínimo diferente.

**Solução:** Verificar validação no backend:
```typescript
// apps/backend/src/modules/payment/...
if (amount < 1.00) {
  throw new BadRequestException('Valor mínimo: R$ 1,00');
}
```

---

## 📊 CHECKLIST DE VALIDAÇÃO FINAL

### Matemática:
- [ ] R$ 1,00 + R$ 0,50 = R$ 1,50 (exato)
- [ ] R$ 10,00 + 2% = R$ 10,20 (exato)
- [ ] R$ 100,00 + 3.33% = R$ 103,33 (arredondado corretamente)

### UX:
- [ ] Recibo mostra "Crédito na Carteira" separado de "Taxa"
- [ ] Nota explicativa está clara
- [ ] Cores ajudam a entender (verde vs laranja)

### Backend:
- [ ] Aceita valores a partir de R$ 0,50
- [ ] Processa PIX corretamente
- [ ] Credita valor exato na carteira

### Mobile:
- [ ] Permite digitar centavos
- [ ] Calcula taxas sem erros
- [ ] Exibe valores formatados corretamente (R$ 1,00 não vira R$ 1)

---

## 🎯 CRITÉRIO DE SUCESSO

**O teste é considerado SUCESSO se:**

1. ✅ Usuário paga R$ 1,50 no PIX
2. ✅ Recebe exatamente R$ 1,00 na carteira
3. ✅ Última transação mostra "+R$ 1,00"
4. ✅ Não há erros de arredondamento
5. ✅ UI deixa claro que R$ 0,50 foi taxa (não sumiu)

---

## 🚀 COMANDO FINAL PARA RODAR

```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Mobile
cd apps/ambra-food
expo start

# No celular: Escanear QR Code com Expo Go
```

---

**Pronto para testar com dinheiro real (valores baixos)!** 💰

**Lembre-se:** 
- Use R$ 1,00 nas primeiras vezes
- Verifique o saldo ANTES e DEPOIS
- Anote os valores para validar a matemática

**Boa sorte nos testes!** 🎉
