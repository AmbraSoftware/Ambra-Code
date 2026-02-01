-- CreateEnum
CREATE TYPE "RefundRequestStatus" AS ENUM ('PENDING', 'WAITING_FUNDS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'REFUND_LOCK';

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "originalTransactionId" UUID NOT NULL,
    "lockTransactionId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "lockedAmount" DECIMAL(12,2) NOT NULL,
    "feeReversed" BOOLEAN NOT NULL DEFAULT false,
    "pixKey" TEXT NOT NULL,
    "pixKeyType" TEXT,
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_originalTransactionId_key" ON "refund_requests"("originalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_lockTransactionId_key" ON "refund_requests"("lockTransactionId");

-- CreateIndex
CREATE INDEX "refund_requests_walletId_status_createdAt_idx" ON "refund_requests"("walletId", "status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_originalTransactionId_fkey" FOREIGN KEY ("originalTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_lockTransactionId_fkey" FOREIGN KEY ("lockTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
