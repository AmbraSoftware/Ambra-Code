-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_schoolId_fkey";

-- AlterTable
ALTER TABLE "announcements" ALTER COLUMN "schoolId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
