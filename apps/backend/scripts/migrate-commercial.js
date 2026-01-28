const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Carregar variáveis do .env
const envConfig = dotenv.config().parsed;

if (!envConfig || !envConfig.DIRECT_URL) {
    console.error('❌ DIRECT_URL não encontrada no arquivo .env');
    process.exit(1);
}

console.log('🚀 Iniciando Migration do Módulo Comercial (Cash-In Fees + Coupons)...');
console.log(`📡 Usando DIRECT_URL (porta 5432): ${envConfig.DIRECT_URL.substring(0, 30)}...`);

try {
    console.log('🔄 Executando: prisma migrate dev --name add_cash_in_fees_and_coupons');
    execSync('npx prisma migrate dev --name add_cash_in_fees_and_coupons', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: envConfig.DIRECT_URL }
    });
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log('📊 Tabelas criadas:');
    console.log('   - cash_in_fees');
    console.log('   - coupons');
    console.log('🎯 Enums criados:');
    console.log('   - CouponType (PERCENTAGE, FIXED)');
    console.log('   - CouponAudience (B2B, B2C)');
    console.log('   - CouponStatus (ACTIVE, EXPIRED, DISABLED)');
} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
}
