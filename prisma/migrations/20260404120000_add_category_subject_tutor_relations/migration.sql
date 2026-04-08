-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToTutorProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToTutorProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubjectToTutorProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubjectToTutorProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE INDEX "subject_categoryId_idx" ON "subject"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_name_categoryId_key" ON "subject"("name", "categoryId");

-- CreateIndex
CREATE INDEX "_CategoryToTutorProfile_B_index" ON "_CategoryToTutorProfile"("B");

-- CreateIndex
CREATE INDEX "_SubjectToTutorProfile_B_index" ON "_SubjectToTutorProfile"("B");

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTutorProfile" ADD CONSTRAINT "_CategoryToTutorProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTutorProfile" ADD CONSTRAINT "_CategoryToTutorProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectToTutorProfile" ADD CONSTRAINT "_SubjectToTutorProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectToTutorProfile" ADD CONSTRAINT "_SubjectToTutorProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
