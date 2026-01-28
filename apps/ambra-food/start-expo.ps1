# Script para iniciar Expo sem validação de dependências
$env:EXPO_NO_DOCTOR = "1"
$env:EXPO_NO_TELEMETRY = "1"
$env:CI = "1"

Write-Host "🚀 Iniciando Expo sem validação..." -ForegroundColor Green
Write-Host "📍 Modo: LAN (192.168.15.9)" -ForegroundColor Cyan

npx expo start --lan --port 8081
