# 🔑 CREDENCIAIS DE TESTE - AMBRA FOOD WEB

## 👨‍🎓 ALUNO (STUDENT)

```
Email: aluno@elite.com
Senha: password123
Role: STUDENT
Escola: Colégio Elite
Saldo Inicial: R$ 150,00
```

---

## 📝 NOTAS:

### Para Criar um Guardian (Responsável):

Se precisar de um usuário tipo **GUARDIAN**, execute no backend:

```typescript
// No seed.ts ou via Prisma Studio
const guardian = await prisma.user.create({
  name: 'Responsável Teste',
  email: 'pai@elite.com',
  passwordHash: await bcrypt.hash('password123', 10),
  role: 'GUARDIAN',
  roles: ['GUARDIAN'],
  schoolId: schoolElite.id,
  termsAccepted: true,
  termsVersion: 'v1',
});

// Criar carteira
await prisma.wallet.create({
  userId: guardian.id,
  balance: 200.00,
  dailyLimit: 50.00,
  creditLimit: 0.00,
});
```

**Ou use a API do Console para criar um novo usuário Guardian.**

---

## 🎯 FLUXO DE TESTE:

1. Acessar: `http://localhost:3002/login`
2. Entrar com: `aluno@elite.com` / `password123`
3. Ver saldo: **R$ 150,00**
4. Testar recarga de **R$ 1,00**
5. Ver que a matemática está correta
6. Verificar que o saldo aumentou

---

## 🎨 CORES ATUALIZADAS:

- **Primary:** `#FC5407` (Laranja Ambra)
- **Primary Hover:** `#e04804`
- **Secondary:** `#FBAF72` (Laranja claro)

✅ **Cores sincronizadas com Ambra Flow e Console!**

---

**Use essas credenciais para testar o MVP!** 🚀🍊
