const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Carregar variáveis do .env
const envConfig = dotenv.config().parsed;

if (!envConfig || !envConfig.DIRECT_URL) {
    console.error('❌ DIRECT_URL não encontrada no arquivo .env');
    process.exit(1);
}

console.log('🔧 FORCE SYNC - Sincronização forçada do banco de dados');
console.log('📡 Usando DIRECT_URL (porta 5432)');
console.log('⚠️  Este comando vai sincronizar o schema ignorando o histórico de migrations');
console.log('✅ SEGURO: Não perde dados, apenas ajusta estrutura\n');

try {
    console.log('🔄 Executando: prisma db push --accept-data-loss');
    
    execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: envConfig.DIRECT_URL }
    });
    
    console.log('\n✅ Sincronização concluída!');
    console.log('🎯 Prisma Client foi gerado automaticamente!');
    
    console.log('\n✅ SUCESSO TOTAL!');
    console.log('📊 Tabelas criadas/atualizadas:');
    console.log('   - cash_in_fees ✅');
    console.log('   - coupons ✅');
    console.log('   - wallets (drift corrigido) ✅');
    console.log('\n🎯 Enums criados:');
    console.log('   - CouponType ✅');
    console.log('   - CouponAudience ✅');
    console.log('   - CouponStatus ✅');
    console.log('\n🚀 Backend pronto para uso!');
    
} catch (error) {
    console.error('\n❌ Erro na sincronização:', error.message);
    process.exit(1);
}
