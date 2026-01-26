# ============================================================================
# NODUM KERNEL - PRISMA 7 MIGRATION FIX
# Versao: 4.0.1
# Objetivo: Aplicar migracoes usando conexao direta (porta 5432)
# ============================================================================

Write-Host ""
Write-Host "NODUM KERNEL - Prisma 7 Migration Fix" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor DarkGray

# 1. Ler o arquivo .env
Write-Host ""
Write-Host "Lendo configuracoes do .env..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERRO: Arquivo .env nao encontrado em: $envPath" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw

# 2. Extrair DIRECT_URL (porta 5432)
if ($envContent -match 'DIRECT_URL\s*=\s*"?([^"\r\n]+)"?') {
    $directUrl = $matches[1].Trim()
    Write-Host "OK: DIRECT_URL encontrada (porta 5432)" -ForegroundColor Green
}
else {
    Write-Host "ERRO: DIRECT_URL nao encontrada no .env" -ForegroundColor Red
    Write-Host "DICA: Certifique-se de que existe uma linha DIRECT_URL no .env" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar se e realmente a porta 5432
if ($directUrl -notmatch ':5432') {
    Write-Host "AVISO: A DIRECT_URL nao parece usar a porta 5432" -ForegroundColor Yellow
    Write-Host "URL: $directUrl" -ForegroundColor DarkGray
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne 's' -and $continue -ne 'S') {
        Write-Host "ERRO: Operacao cancelada pelo usuario" -ForegroundColor Red
        exit 1
    }
}

# 4. Definir DATABASE_URL temporariamente
Write-Host ""
Write-Host "Configurando DATABASE_URL para conexao direta..." -ForegroundColor Yellow
$env:DATABASE_URL = $directUrl

# 5. Exibir informacoes da conexao (sem senha)
$safeUrl = $directUrl -replace ':[^@]+@', ':****@'
Write-Host "Conexao: $safeUrl" -ForegroundColor Cyan

# 6. Verificar status das migracoes
Write-Host ""
Write-Host "Verificando status das migracoes..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

npx prisma migrate status 2>&1 | ForEach-Object {
    if ($_ -match 'error|Error|ERROR') {
        Write-Host $_ -ForegroundColor Red
    }
    elseif ($_ -match 'pending|Pending|PENDING') {
        Write-Host $_ -ForegroundColor Yellow
    }
    elseif ($_ -match 'applied|Applied|up to date') {
        Write-Host $_ -ForegroundColor Green
    }
    else {
        Write-Host $_ -ForegroundColor White
    }
}

$statusExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

# 7. Decidir proxima acao baseado no status
if ($statusExitCode -eq 0) {
    Write-Host "OK: Migracoes estao sincronizadas!" -ForegroundColor Green
    Write-Host "DICA: Nenhuma acao necessaria." -ForegroundColor Cyan
}
else {
    Write-Host "AVISO: Existem migracoes pendentes ou problemas detectados" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Aplicando migracoes..." -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
    
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK: Migracoes aplicadas com sucesso!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "ERRO: Erro ao aplicar migracoes (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# 8. Gerar Prisma Client atualizado
Write-Host ""
Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Prisma Client gerado com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "AVISO: Erro ao gerar Prisma Client (Exit Code: $LASTEXITCODE)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor DarkGray
Write-Host "Processo concluido!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor DarkGray
Write-Host ""
