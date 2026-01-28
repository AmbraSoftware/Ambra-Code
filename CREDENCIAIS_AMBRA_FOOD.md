# 🔐 CREDENCIAIS DEFINITIVAS - AMBRA FOOD WEB

## ✅ USUÁRIOS DISPONÍVEIS:

### 👨‍🎓 ALUNO (STUDENT) - ✅ FUNCIONANDO

```
Email: aluno@elite.com
Senha: password123
Tipo: STUDENT
Saldo: R$ 150,00
Escola: Colégio Elite
```

**Como usar:**
1. Abra `http://localhost:3002/login`
2. Clique na aba **"Aluno"**
3. Digite: `aluno@elite.com` / `password123`
4. Entre!

---

### 👨‍👩‍👧‍👦 RESPONSÁVEL (GUARDIAN) - ⚠️ CRIAR MANUALMENTE

**Ainda não existe no banco.**

Para criar um responsável, use o Ambra Console:
1. Acesse `http://localhost:3001`
2. Login admin: `admin@nodum.io` / `Diel@0002323`
3. Vá em "Usuários" → "Criar Usuário"
4. Tipo: GUARDIAN
5. Email: `pai@teste.com`
6. Senha: `senha123`

**OU** aguarde próxima fase do seed.

---

## 🎨 UX MELHORADA:

### Abas Separadas
- ✅ **Aba "Aluno":** Login específico para estudantes
- ✅ **Aba "Responsável":** Login específico para pais

### Validação Inteligente
- ❌ Se tentar logar como aluno com email de responsável → Erro claro
- ❌ Se tentar logar como responsável com email de aluno → Erro claro
- ✅ Placeholders específicos por tipo
- ✅ Dicas visuais (ícones diferentes)

### Credenciais Visíveis (Teste)
- 💡 Clique em "💡 Credenciais de Teste" para ver as credenciais corretas

---

## 🔄 EXECUTAR SCRIPT NOVAMENTE (SE NECESSÁRIO):

Se os usuários ainda não existirem:

```powershell
cd C:\Users\Usuário\Documents\AmbraCode\apps\backend
npx ts-node src/scripts/create-test-users.ts
```

---

## 🎯 DIFERENÇAS ALUNO vs RESPONSÁVEL:

| Característica | Aluno | Responsável |
|----------------|-------|-------------|
| **Saldo Inicial** | R$ 50,00 | R$ 200,00 |
| **Limite Diário** | Menor | Maior |
| **Permissões** | Limitadas | Controle total |
| **UI** | Simplificada | Completa |

---

**Use a aba correta para cada tipo de usuário!** 🎯
