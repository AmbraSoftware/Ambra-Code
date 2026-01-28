# Migration Script - Módulo Comercial (Cash-In Fees + Coupons)
# Usa DIRECT_URL (porta 5432) ao invés do Pooler (porta 6543)

Write-Host "🚀 Iniciando Migration do Módulo Comercial..." -ForegroundColor Green
Write-Host "📡 Este script usa a DIRECT_URL para evitar problemas com prepared statements" -ForegroundColor Cyan

# Executar o script Node.js que faz o bypass
node scripts/migrate-commercial.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration concluída com sucesso!" -ForegroundColor Green
    Write-Host "🎉 Backend do Módulo Comercial está pronto para uso!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. npm run start:dev (para testar localmente)"
    Write-Host "   2. Testar endpoints em http://localhost:3333/global-admin/cash-in-fees"
} else {
    Write-Host ""
    Write-Host "❌ Erro ao aplicar migration. Verifique os logs acima." -ForegroundColor Red
    exit 1
}
