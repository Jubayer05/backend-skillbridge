-- DropForeignKey
ALTER TABLE "TutorProfile" DROP CONSTRAINT "TutorProfile_userId_fkey";

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
