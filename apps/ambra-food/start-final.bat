@echo off
cls
echo ========================================
echo   AMBRA FOOD - Iniciando Mobile App
echo ========================================
echo.

REM Desabilitar todas as validações e telemetria
SET EXPO_NO_DOCTOR=true
SET EXPO_NO_TELEMETRY=true
SET EXPO_NO_GIT_STATUS=true
SET CI=true
SET NODE_ENV=development

echo [1/3] Limpando cache...
IF EXIST .expo RMDIR /S /Q .expo 2>NUL

echo [2/3] Configurando ambiente...
echo   - EXPO_NO_DOCTOR: ON
echo   - CI Mode: ON
echo   - Modo: LAN
echo.

echo [3/3] Iniciando Metro Bundler...
echo.
echo ========================================
echo   Aguarde "Waiting on..." aparecer
echo   Depois conecte: exp://192.168.15.9:8081
echo ========================================
echo.

npx expo start --lan --no-dev --clear

pause
