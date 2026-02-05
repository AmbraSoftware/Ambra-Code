FROM node:22-slim

WORKDIR /app

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Install correct Prisma version (5.21.1 to match project)
RUN npm install prisma@5.21.1 --save-exact -w apps/backend

# Copy prisma schema
COPY apps/backend/prisma ./apps/backend/prisma/

# Generate Prisma Client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Copy source code
COPY . .

# Build the application
RUN npm run build -w apps/backend

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "apps/backend/dist/main.js"]
