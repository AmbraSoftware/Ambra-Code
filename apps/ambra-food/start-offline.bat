@echo off
cls
echo ========================================
echo   MODO OFFLINE - Sem Validacoes
echo ========================================
echo.

SET EXPO_NO_DOCTOR=1
SET EXPO_OFFLINE=1
SET CI=1

echo Iniciando em modo offline (sem internet)...
echo Conecte manualmente: exp://192.168.15.9:8081
echo.

npx expo start --offline --clear

pause
