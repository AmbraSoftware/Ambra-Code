-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SALE', 'CONSUMPTION');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('STUDENT', 'MERCHANT', 'AMBRA', 'SCHOOL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'MERCHANT_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'OPERATOR_SALES';
ALTER TYPE "UserRole" ADD VALUE 'OPERATOR_MEAL';
ALTER TYPE "UserRole" ADD VALUE 'CONSUMER';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SALE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "class" TEXT,
ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY['STUDENT']::"UserRole"[],
ALTER COLUMN "role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "discount_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discount_rules_schoolId_idx" ON "discount_rules"("schoolId");

-- AddForeignKey
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
