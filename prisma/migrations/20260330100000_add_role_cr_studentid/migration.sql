-- AlterEnum: rename TUTOR to CR
ALTER TYPE "Role" RENAME VALUE 'TUTOR' TO 'CR';

-- AlterTable: add studentId column to user
ALTER TABLE "user" ADD COLUMN "studentId" TEXT;
