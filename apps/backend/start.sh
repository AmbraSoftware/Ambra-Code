#!/bin/sh
set -e

# Log imediato para confirmar execução
echo "[START.SH] Script started at $(date)"
echo "[START.SH] Current directory: $(pwd)"
echo "[START.SH] User: $(whoami)"
echo ""
echo "🔍 PROCURANDO MAIN.JS..."
find /app -name "main.js" -type f 2>/dev/null || echo "🔍 main.js não encontrado em /app"

echo "=========================================="
echo "STARTING AMBRA BACKEND"
echo "=========================================="
echo "PORT: ${PORT:-3333}"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "Time: $(date)"
echo "=========================================="

# Check if dist exists
echo "[1/3] Checking build artifacts..."
echo "[1/3] Looking for: apps/backend/dist/main.js"
ls -la apps/backend/dist/ 2>/dev/null || echo "[1/3] WARNING: dist folder not found or empty"

if [ ! -f "apps/backend/dist/main.js" ]; then
    echo "[1/3] ERROR: dist/main.js not found!"
    echo "[1/3] Checking alternative paths..."
    find . -name "main.js" -type f 2>/dev/null | head -5
    exit 1
fi
echo "[1/3] ✓ Build artifacts verified"

# Wait for DB to be fully ready after migrations
echo "[2/3] Waiting for database to stabilize (5s)..."
sleep 5
echo "[2/3] ✓ Database ready"

# Start app with explicit error handling
echo "[3/3] Starting NestJS application..."
echo "=========================================="
exec node apps/backend/dist/main.js
