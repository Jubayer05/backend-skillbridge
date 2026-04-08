-- CreateEnum
CREATE TYPE "AvailabilitySlotStatus" AS ENUM ('AVAILABLE', 'BOOKED');

-- CreateTable
CREATE TABLE "availability_slot" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "AvailabilitySlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_slot_tutorId_date_idx" ON "availability_slot"("tutorId", "date");

-- CreateIndex
CREATE INDEX "availability_slot_tutorId_startAt_endAt_idx" ON "availability_slot"("tutorId", "startAt", "endAt");

-- AddForeignKey
ALTER TABLE "availability_slot" ADD CONSTRAINT "availability_slot_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
