FROM node:20-slim

WORKDIR /app

# Install system dependencies for Prisma and Puppeteer/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies (sem cache mounts conflitantes)
RUN npm ci --prefer-offline --no-audit

# Copy prisma schema
COPY apps/backend/prisma ./apps/backend/prisma/

# Generate Prisma Client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Copy source code
COPY . .

# Build the application
RUN npm run build -w apps/backend

# Make entrypoint executable
RUN chmod +x apps/backend/entrypoint.sh

# Expose port (must match process.env.PORT || 3333 in main.ts)
EXPOSE 3333

# Start command with proper entrypoint
CMD ["sh", "apps/backend/entrypoint.sh"]
