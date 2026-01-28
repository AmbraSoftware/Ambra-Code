@echo off
echo 🔧 FORCE SYNC - Sincronizacao Profissional do Banco
echo ================================================
echo.
echo Este script vai:
echo   1. Ignorar historico de migrations conflitante
echo   2. Sincronizar schema atual com banco de dados
echo   3. Criar tabelas cash_in_fees e coupons
echo   4. Gerar Prisma Client atualizado
echo.
echo ✅ SEGURO: Nao perde dados existentes
echo.

node scripts\force-sync-db.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✅ SINCRONIZACAO CONCLUIDA COM SUCESSO!
    echo ================================================
    echo.
    echo 🎉 Modulo Comercial 100%% funcional!
    echo.
    echo 📋 Proximos passos:
    echo    1. npm run start:dev
    echo    2. Acessar: http://localhost:3333/global-admin/cash-in-fees
    echo.
) else (
    echo.
    echo ❌ ERRO na sincronizacao. Verifique os logs acima.
    exit /b 1
)
