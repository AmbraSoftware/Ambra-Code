#!/bin/sh
set -e

echo "=========================================="
echo "STARTING AMBRA BACKEND"
echo "=========================================="
echo "PORT: ${PORT:-3333}"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "Time: $(date)"
echo "=========================================="

# Wait for DB to be fully ready after migrations
echo "[1/3] Waiting for database to stabilize after migrations..."
sleep 3
echo "[1/3] ✓ Database ready"

# Verify dist exists
echo "[2/3] Checking build artifacts..."
if [ ! -f "apps/backend/dist/main.js" ]; then
    echo "[2/3] ❌ ERROR: dist/main.js not found!"
    echo "Build may have failed. Check Railway build logs."
    exit 1
fi
echo "[2/3] ✓ Build artifacts verified"

# Start app
echo "[3/3] Starting NestJS application..."
echo "=========================================="
exec node apps/backend/dist/main.js
