-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "overdraftLimit" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
