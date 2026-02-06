#!/bin/sh
set -e

echo "[ENTRYPOINT] Starting Ambra Backend..."
echo "[ENTRYPOINT] Node version: $(node --version)"
echo "[ENTRYPOINT] PORT: ${PORT:-3333}"
echo "[ENTRYPOINT] NODE_ENV: ${NODE_ENV:-not set}"
echo "[ENTRYPOINT] DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo 'YES'; else echo 'NO'; fi)"
echo "[ENTRYPOINT] SENTRY_DSN exists: $(if [ -n "$SENTRY_DSN" ]; then echo 'YES'; else echo 'NO'; fi)"

# Wait for database to be ready
echo "[ENTRYPOINT] Waiting for database..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma db execute --stdin --schema=apps/backend/prisma/schema.prisma <<<'SELECT 1' > /dev/null 2>&1; then
    echo "[ENTRYPOINT] Database is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "[ENTRYPOINT] Database not ready, retrying... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "[ENTRYPOINT] ERROR: Database not available after $MAX_RETRIES retries"
  exit 1
fi

# Run migrations
echo "[ENTRYPOINT] Running database migrations..."
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma

echo "[ENTRYPOINT] Migrations completed successfully!"

# Start the application
echo "[ENTRYPOINT] Starting NestJS application..."
exec node apps/backend/dist/main.js
