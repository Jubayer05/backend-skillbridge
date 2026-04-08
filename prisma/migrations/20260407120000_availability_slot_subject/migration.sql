-- AlterTable
ALTER TABLE "availability_slot" ADD COLUMN "subjectId" TEXT;

-- CreateIndex
CREATE INDEX "availability_slot_subjectId_idx" ON "availability_slot"("subjectId");

-- AddForeignKey
ALTER TABLE "availability_slot" ADD CONSTRAINT "availability_slot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
