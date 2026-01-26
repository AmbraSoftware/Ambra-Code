const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Carregar variáveis do .env
const envConfig = dotenv.config().parsed;

if (!envConfig || !envConfig.DIRECT_URL) {
    console.error('❌ DIRECT_URL não encontrada no arquivo .env');
    process.exit(1);
}

console.log('🚀 Iniciando Migração com Bypass de Conexão...');
console.log(`📡 Usando DIRECT_URL: ${envConfig.DIRECT_URL.substring(0, 20)}...`);

try {
    // Definir DATABASE_URL como DIRECT_URL apenas para este processo
    process.env.DATABASE_URL = envConfig.DIRECT_URL;

    console.log('🔄 Executando: prisma migrate reset --force');
    execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: envConfig.DIRECT_URL }
    });
    
    console.log('✅ Migração concluída com sucesso!');
} catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
}
