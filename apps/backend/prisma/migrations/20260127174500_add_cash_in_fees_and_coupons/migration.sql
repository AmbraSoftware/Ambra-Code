-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponAudience" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISABLED');

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "audience" "CouponAudience" NOT NULL,
    "planId" UUID,
    "validUntil" TIMESTAMPTZ(3) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_in_fees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "boletoGatewayCost" DOUBLE PRECISION NOT NULL DEFAULT 3.49,
    "boletoChargeCustomer" BOOLEAN NOT NULL DEFAULT true,
    "boletoCustomerFixed" DOUBLE PRECISION NOT NULL DEFAULT 4.00,
    "boletoCustomerPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boletoChargeMerchant" BOOLEAN NOT NULL DEFAULT false,
    "boletoMerchantFixed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boletoMerchantPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "pixGatewayCost" DOUBLE PRECISION NOT NULL DEFAULT 0.99,
    "pixChargeCustomer" BOOLEAN NOT NULL DEFAULT true,
    "pixCustomerFixed" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "pixCustomerPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pixChargeMerchant" BOOLEAN NOT NULL DEFAULT true,
    "pixMerchantFixed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pixMerchantPercent" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cash_in_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_status_idx" ON "coupons"("code", "status");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
