-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_transactionId_fkey";

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "transactionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "fiscal_pending_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorId" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "invoiceId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),

    CONSTRAINT "fiscal_pending_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_pending_items_transactionId_key" ON "fiscal_pending_items"("transactionId");

-- CreateIndex
CREATE INDEX "fiscal_pending_items_operatorId_status_idx" ON "fiscal_pending_items"("operatorId", "status");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_pending_items" ADD CONSTRAINT "fiscal_pending_items_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_pending_items" ADD CONSTRAINT "fiscal_pending_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_pending_items" ADD CONSTRAINT "fiscal_pending_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
