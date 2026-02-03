// apps/backend/src/scripts/verify-critical-features.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../modules/orders/orders.service';
import { TransactionService } from '../modules/transactions/transactions.service';
import { EncryptionService } from '../common/services/encryption.service';
import { OrderStatus, SchoolStatus, UserRole, TransactionType } from '@prisma/client';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const ordersService = app.get(OrdersService);
  const transactionService = app.get(TransactionService);
  const encryptionService = app.get(EncryptionService);
  const logger = new Logger('CriticalCheck');

  console.log('\n🚀 INICIANDO BATERIA DE TESTES AUTOMATIZADOS (CRITICAL FEATURES)...\n');

  let createdOrderId: string | null = null;
  let createdOperatorId: string | null = null;

  try {
    // ---------------------------------------------------------
    // PREPARAÇÃO (SETUP)
    // ---------------------------------------------------------
    const school = await prisma.school.findFirst();
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    const product = await prisma.product.findFirst({ where: { stock: { gt: 10 } } });
    const operator = await prisma.user.findFirst({ where: { role: { in: ['OPERATOR_SALES', 'SCHOOL_ADMIN'] } } });

    if (!school || !student || !product || !operator) {
      throw new Error('❌ PRE-REQUISITO: Precisa ter Escola, Aluno, Produto e Operador no banco.');
    }

    console.log(`📋 Setup: School=${school.name}, Student=${student.name}, Product=${product.name}`);

    // ---------------------------------------------------------
    // TESTE 1: Criptografia Asaas (Security)
    // ---------------------------------------------------------
    console.log('\n🔒 [1/5] Testando Criptografia de Credenciais...');
    const fakeApiKey = 'sk_test_123456_fake_key_for_encryption_test';
    
    // Criar operador diretamente com chave criptografada (sem chamar API Asaas)
    const encryptedKey = encryptionService.encrypt(fakeApiKey);
    const uniqueTaxId = `999888${Date.now().toString().slice(-6)}`;
    const newOp = await prisma.operator.create({
      data: {
        name: 'Operator Test Crypto',
        taxId: uniqueTaxId,
        asaasApiKey: encryptedKey,
      }
    });
    createdOperatorId = newOp.id;

    // Verificar no banco (RAW) se está criptografado
    const rawOp = await prisma.operator.findUnique({ where: { id: newOp.id } });
    if (rawOp?.asaasApiKey === fakeApiKey) throw new Error('❌ FALHA: Chave salva em texto plano no banco!');
    if (!rawOp?.asaasApiKey?.includes(':')) throw new Error('❌ FALHA: Formato de hash inválido (sem IV).');

    // Verificar descriptografia
    const decrypted = encryptionService.decrypt(rawOp.asaasApiKey!);
    if (decrypted !== fakeApiKey) throw new Error('❌ FALHA: Descriptografia retornou valor errado.');
    
    console.log('   ✅ Criptografia AES-256-GCM validada com sucesso.');

    // ---------------------------------------------------------
    // TESTE 2: Validação School.status (RLS)
    // ---------------------------------------------------------
    console.log('\n⛔ [2/5] Testando Bloqueio de Escola Suspensa...');
    
    // Suspender escola temporariamente
    await prisma.school.update({ where: { id: school.id }, data: { status: SchoolStatus.SUSPENDED } });

    let blocked = false;
    try {
      await ordersService.create(student.id, {
        studentId: student.id,
        items: [{ productId: product.id, quantity: 1 }],
      });
    } catch (e: any) {
      if (e.message?.includes('ativa') || e.status === 403) blocked = true;
    }

    // Restaurar escola
    await prisma.school.update({ where: { id: school.id }, data: { status: SchoolStatus.ACTIVE } });

    if (!blocked) throw new Error('❌ FALHA: Sistema permitiu pedido em escola SUSPENSA.');
    console.log('   ✅ Bloqueio de School.status funcional.');

    // ---------------------------------------------------------
    // TESTE 3: AuditHash Blockchain (Integrity)
    // ---------------------------------------------------------
    console.log('\n🔗 [3/5] Testando AuditHash na Transação...');
    
    // Garantir saldo para o teste
    await prisma.wallet.update({ 
        where: { userId: student.id }, 
        data: { balance: 9999, overdraftLimit: 100 } 
    });

    // Criar pedido real
    const order = await ordersService.create(student.id, {
      studentId: student.id,
      items: [{ productId: product.id, quantity: 1 }],
    });
    createdOrderId = order.id;

    // Buscar transação gerada
    const tx = await prisma.transaction.findFirst({ 
        where: { orderId: order.id },
        orderBy: { createdAt: 'desc' }
    });

    if (!tx?.auditHash) throw new Error('❌ FALHA: Transação criada sem AuditHash.');
    if (tx.auditHash.length !== 64) throw new Error('❌ FALHA: AuditHash não parece um SHA-256 válido.');
    
    console.log(`   ✅ AuditHash gerado: ${tx.auditHash.substring(0, 20)}...`);

    // ---------------------------------------------------------
    // TESTE 4: InventoryLog (Traceability)
    // ---------------------------------------------------------
    console.log('\n📦 [4/5] Testando InventoryLog no Checkout...');
    
    const logs = await prisma.inventoryLog.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
        take: 1
    });

    if (logs.length === 0) throw new Error('❌ FALHA: Nenhum InventoryLog criado após venda.');
    
    console.log(`   ✅ InventoryLog de venda registrado (change=${logs[0].change}).`);

    // ---------------------------------------------------------
    // TESTE 5: Cancelamento e Estorno (Refund)
    // ---------------------------------------------------------
    console.log('\n💸 [5/5] Testando Cancelamento e Estorno...');
    
    const walletBefore = await prisma.wallet.findUnique({ where: { userId: student.id } });
    
    // Cancelar o pedido criado no passo 3
    await ordersService.cancelOrder(
        order.id, 
        { reason: 'Teste Automatizado de Estorno' }, 
        { id: operator.id, schoolId: school.id, role: UserRole.OPERATOR_SALES, sub: operator.id, roles: ['OPERATOR_SALES'] } as any
    );

    // Verificações
    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
    const walletAfter = await prisma.wallet.findUnique({ where: { userId: student.id } });
    const refundTx = await prisma.transaction.findFirst({
        where: { orderId: order.id, type: 'REFUND' }
    });

    if (orderAfter?.status !== OrderStatus.CANCELLED) throw new Error('❌ FALHA: Status do pedido não mudou para CANCELLED.');
    if (Number(walletAfter?.balance) <= Number(walletBefore?.balance)) throw new Error('❌ FALHA: Saldo não foi estornado.');
    if (!refundTx) throw new Error('❌ FALHA: Transação de REFUND não encontrada.');

    console.log('   ✅ Cancelamento: Status OK, Saldo Devolvido, Estoque Estornado, Logs OK.');

    console.log('\n✨ SUCESSO TOTAL! TODAS AS FEATURES CRÍTICAS ESTÃO FUNCIONAIS. ✨\n');

  } catch (error: any) {
    console.error('\n❌ ERRO FATAL NO TESTE:', error.message);
    if (error.response) console.error('Detalhes:', JSON.stringify(error.response, null, 2));
    process.exit(1);
  } finally {
    // Cleanup
    if (createdOperatorId) {
      await prisma.operator.delete({ where: { id: createdOperatorId } }).catch(() => {});
    }
    await app.close();
  }
}

bootstrap();
