-- Replace per-(name, category) uniqueness with global unique subject name.
DROP INDEX IF EXISTS "subject_name_categoryId_key";

CREATE UNIQUE INDEX "subject_name_key" ON "subject"("name");
