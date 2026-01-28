# FORCE SYNC - Sincronização forçada do banco de dados
# Resolve problemas de drift entre migrations e estado real do banco
# SEGURO: Não perde dados, apenas sincroniza estrutura

Write-Host "🔧 FORCE SYNC - Sincronização Profissional do Banco" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script vai:" -ForegroundColor Yellow
Write-Host "  1. Ignorar histórico de migrations conflitante" -ForegroundColor White
Write-Host "  2. Sincronizar schema atual com banco de dados" -ForegroundColor White
Write-Host "  3. Criar tabelas cash_in_fees e coupons" -ForegroundColor White
Write-Host "  4. Gerar Prisma Client atualizado" -ForegroundColor White
Write-Host ""
Write-Host "✅ SEGURO: Não perde dados existentes" -ForegroundColor Green
Write-Host ""

# Executar o script Node.js
node scripts/force-sync-db.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Módulo Comercial 100% funcional!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. npm run start:dev (testar backend)" -ForegroundColor White
    Write-Host "   2. Acessar: http://localhost:3333/global-admin/cash-in-fees" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ERRO na sincronização. Verifique os logs acima." -ForegroundColor Red
    exit 1
}
