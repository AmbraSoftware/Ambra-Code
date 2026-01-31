-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "grossAmount" DECIMAL(10,2),
ADD COLUMN     "metadata" JSONB;
