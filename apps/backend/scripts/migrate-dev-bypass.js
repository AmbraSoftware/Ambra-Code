const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Carregar variáveis do .env
const envConfig = dotenv.config().parsed;

if (!envConfig || !envConfig.DIRECT_URL) {
    console.error('❌ DIRECT_URL não encontrada no arquivo .env');
    process.exit(1);
}

console.log('🚀 Iniciando Prisma Migrate Dev com Bypass de Conexão...');
console.log(`📡 Usando DIRECT_URL: ${envConfig.DIRECT_URL.substring(0, 20)}...`);

try {
    console.log('🔄 Executando: prisma migrate dev --name v4_7_fees_architecture');
    execSync('npx prisma migrate dev --name v4_7_fees_architecture', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: envConfig.DIRECT_URL }
    });
    
    console.log('✅ Migração v4.7 aplicada com sucesso!');
} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
}
