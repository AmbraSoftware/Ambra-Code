@echo off
SET EXPO_NO_DOCTOR=1
SET EXPO_NO_TELEMETRY=1
SET EXPO_NO_WEB_SETUP=1
SET NODE_ENV=development

echo ========================================
echo   Iniciando Expo Mobile - Ambra Food
echo ========================================
echo.
echo   Modo: LAN (192.168.15.9:8081)
echo   Aguarde: Metro Bundler iniciar...
echo.
echo   IMPORTANTE:
echo   - NAO feche esta janela!
echo   - Aguarde "Waiting on..." aparecer
echo   - Conecte no Expo Go: exp://192.168.15.9:8081
echo.
echo ========================================
echo.

npx expo start --lan --port 8081 --no-dev
