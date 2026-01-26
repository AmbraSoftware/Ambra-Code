import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = `operator.test.${Date.now()}@nodum.app`;
  const password = 'Password@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Operator Entity (Required for OPERATOR_ADMIN usually, but let's see if we can just create the user first or if we need the operator entity linked)
  // The User model doesn't have operatorId directly, but usually OPERATOR_ADMIN manages an Operator entity.
  // Looking at schema: Operator model exists. User doesn't seem to have direct relation to Operator in the schema snippet I saw, 
  // BUT `Operator` has `asaasId`.
  // Wait, let's check User model again in schema.
  // User has `schoolId`, `governmentId`, `canteenId`.
  // It does NOT have `operatorId`.
  // However, `Canteen` has `operatorId`.
  // And `Canteen` has `operators` (User[]).
  
  // If I am an OPERATOR_ADMIN, how does the system know which Operator entity I own?
  // Maybe I am just a user with role OPERATOR_ADMIN and I am linked to Canteens?
  // Or maybe there's a missing relation in my analysis.
  // Let's check `auth.service.ts` register method again.
  // It creates an `Operator` entity and then a `User`.
  // But how are they linked?
  // `const operator = await tx.operator.create(...)`
  // `const user = await tx.user.create(...)`
  // It seems `user` is NOT linked to `operator` in `auth.service.ts` snippet I read.
  // `schoolId` was set for SCHOOL_ADMIN.
  // For OPERATOR_ADMIN, `schoolId` was null.
  // Wait, if `user` is not linked to `operator`, how does the system know?
  // Maybe by email? Or maybe I missed a field in `User` model.
  
  // Re-reading schema for User:
  // schoolId, governmentId, canteenId.
  // No operatorId.
  
  // Let's look at `auth.service.ts` again.
  // "const operator = await tx.operator.create(...)"
  // "operatorId = operator.id;"
  // Then "const user = await tx.user.create(...)"
  // It uses `schoolId` (which is null for operator).
  // It seems the `Operator` entity is created but not linked to the User in that transaction block I saw?
  // That would be a bug in the backend if true, or I missed something.
  // Let's re-read `auth.service.ts` content from previous turn history.
  
  /*
  if (profileType === 'school') {
     const school = ...
     schoolId = school.id;
  } else {
     const operator = ...
     operatorId = operator.id;
  }
  
  const user = await tx.user.create({
    data: {
      ...
      schoolId: schoolId, // null for operator
      // No operatorId here?
    }
  })
  */
  
  // If `operatorId` is not saved in User, then the link is lost.
  // Unless `User` has `operatorId` and I missed it in the schema print.
  // Let's check schema again.
  // `User` model:
  // schoolId, governmentId, canteenId.
  // No operatorId.
  
  // This implies that currently `OPERATOR_ADMIN` users might be "floating" or linked via another way?
  // Or maybe `canteenId`? But an operator owns the "Company", not just one canteen initially.
  
  // Ideally, `User` should have `operatorId`.
  // If not, maybe we should fix this. But for now, let's just create the user as the system currently does.
  // The system creates a user with `OPERATOR_ADMIN` role and `schoolId: null`.
  
  // I will create just the User for now, as that's what's needed for Login.
  
  const user = await prisma.user.create({
    data: {
      name: 'Operador de Teste',
      email,
      passwordHash: hashedPassword,
      role: 'OPERATOR_ADMIN',
      termsAccepted: true,
      mustChangePassword: false,
    },
  });

  console.log('User created successfully!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${user.role}`);
  console.log(`ID: ${user.id}`);
  
  const fs = require('fs');
  fs.writeFileSync('operator-creds.txt', `Email: ${email}\nPassword: ${password}\nID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
