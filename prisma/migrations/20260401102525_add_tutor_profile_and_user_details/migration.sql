-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "TutorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "experience" INTEGER NOT NULL,
    "education" TEXT NOT NULL,
    "languages" TEXT[],
    "rating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "profileImageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorProfile_userId_key" ON "TutorProfile"("userId");

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
