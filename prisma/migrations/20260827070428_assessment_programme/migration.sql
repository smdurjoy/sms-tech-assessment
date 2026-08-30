/*
  Warnings:

  - Added the required column `programmeId` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "programmeId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Assessment_programmeId_idx" ON "Assessment"("programmeId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
