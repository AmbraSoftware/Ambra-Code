@echo off
echo ========================================
echo   Corrigindo versoes do React
echo ========================================
echo.

echo [1/3] Limpando node_modules...
IF EXIST node_modules RMDIR /S /Q node_modules
IF EXIST package-lock.json DEL /F package-lock.json
IF EXIST .expo RMDIR /S /Q .expo

echo [2/3] Instalando dependencias corretas...
npm install --legacy-peer-deps

echo [3/3] Limpeza completa...
echo.
echo ========================================
echo   Pronto! Execute: .\start-offline.bat
echo ========================================
pause
