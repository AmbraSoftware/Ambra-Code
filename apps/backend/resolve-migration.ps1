# ============================================================================
# NODUM KERNEL - RESOLVE FAILED MIGRATION
# Versao: 4.0.1
# Objetivo: Resolver migracao falhada e aplicar pendentes
# ============================================================================

Write-Host ""
Write-Host "NODUM KERNEL - Resolve Failed Migration" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor DarkGray

# 1. Ler DIRECT_URL do .env
Write-Host ""
Write-Host "Lendo configuracoes do .env..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERRO: Arquivo .env nao encontrado" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw

if ($envContent -match 'DIRECT_URL\s*=\s*"?([^"\r\n]+)"?') {
    $directUrl = $matches[1].Trim()
    Write-Host "OK: DIRECT_URL encontrada" -ForegroundColor Green
}
else {
    Write-Host "ERRO: DIRECT_URL nao encontrada no .env" -ForegroundColor Red
    exit 1
}

# 2. Configurar DATABASE_URL
$env:DATABASE_URL = $directUrl
$safeUrl = $directUrl -replace ':[^@]+@', ':****@'
Write-Host "Conexao: $safeUrl" -ForegroundColor Cyan

# 3. Marcar migracao falhada como aplicada (rolled-back)
Write-Host ""
Write-Host "Marcando migracao falhada como rolled-back..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

npx prisma migrate resolve --rolled-back "20260105160000_sync_schema_v4_2_final"

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Migracao marcada como rolled-back" -ForegroundColor Green
}
else {
    Write-Host "ERRO: Falha ao marcar migracao (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tentando marcar como aplicada (applied)..." -ForegroundColor Yellow
    
    npx prisma migrate resolve --applied "20260105160000_sync_schema_v4_2_final"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Migracao marcada como aplicada" -ForegroundColor Green
    }
    else {
        Write-Host "ERRO: Falha ao resolver migracao" -ForegroundColor Red
        exit 1
    }
}

# 4. Verificar status novamente
Write-Host ""
Write-Host "Verificando status apos resolucao..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

npx prisma migrate status

# 5. Aplicar migracoes pendentes
Write-Host ""
Write-Host "Aplicando migracoes pendentes..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK: Migracoes aplicadas com sucesso!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "AVISO: Algumas migracoes podem ter falhado (Exit Code: $LASTEXITCODE)" -ForegroundColor Yellow
}

# 6. Gerar Prisma Client
Write-Host ""
Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Prisma Client gerado!" -ForegroundColor Green
}
else {
    Write-Host "AVISO: Erro ao gerar Prisma Client" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor DarkGray
Write-Host "Processo concluido!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor DarkGray
Write-Host ""
