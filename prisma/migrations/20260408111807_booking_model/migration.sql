-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "availabilitySlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_availabilitySlotId_key" ON "booking"("availabilitySlotId");

-- CreateIndex
CREATE INDEX "booking_studentId_idx" ON "booking"("studentId");

-- CreateIndex
CREATE INDEX "booking_tutorProfileId_idx" ON "booking"("tutorProfileId");

-- CreateIndex
CREATE INDEX "booking_status_idx" ON "booking"("status");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "availability_slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
