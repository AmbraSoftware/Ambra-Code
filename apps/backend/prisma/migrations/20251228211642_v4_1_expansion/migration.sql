-- AlterTable
ALTER TABLE "nutritional_profiles" ADD COLUMN     "goals" JSONB;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "scheduledFor" TIMESTAMPTZ(3);
