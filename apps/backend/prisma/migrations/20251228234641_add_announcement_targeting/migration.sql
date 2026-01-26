-- CreateEnum
CREATE TYPE "AnnouncementScope" AS ENUM ('GLOBAL', 'GOVERNMENT', 'SYSTEM', 'SCHOOL', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "scope" "AnnouncementScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "targetIds" TEXT[];
