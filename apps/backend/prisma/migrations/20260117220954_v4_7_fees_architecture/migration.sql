/*
  Warnings:

  - You are about to drop the column `asaasKey` on the `operators` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nfcId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlanTarget" AS ENUM ('SCHOOL_SAAS', 'GUARDIAN_PREMIUM');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CREDIT_EXPENSE';

-- AlterTable
ALTER TABLE "operators" DROP COLUMN "asaasKey",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "asaasApiKey" TEXT,
ADD COLUMN     "dataExpirationDate" DATE,
ADD COLUMN     "isDataExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobilePhone" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "creditCeiling" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "feesConfig" JSONB,
ADD COLUMN     "target" "PlanTarget" NOT NULL DEFAULT 'SCHOOL_SAAS';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "minStockAlert" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "asaasAccountId" TEXT,
ADD COLUMN     "asaasApiKey" TEXT,
ADD COLUMN     "asaasWalletId" TEXT,
ADD COLUMN     "customFeesConfig" JSONB,
ADD COLUMN     "mobilePhone" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nfcId" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "subscriptionPlanId" UUID,
ADD COLUMN     "subscriptionStatus" TEXT;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "is_debt_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negativeSince" TIMESTAMPTZ(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_nfcId_key" ON "users"("nfcId");
