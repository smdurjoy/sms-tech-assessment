/*
  Warnings:

  - You are about to drop the column `feeDueDate` on the `Student` table. All the data in the column will be lost.
  - Added the required column `installmentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationSemesters` to the `Programme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "installmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "durationSemesters" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "feeDueDate";

-- CreateTable
CREATE TABLE "FeeInstallment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeInstallment_studentId_idx" ON "FeeInstallment"("studentId");

-- CreateIndex
CREATE INDEX "FeeInstallment_dueDate_idx" ON "FeeInstallment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "FeeInstallment_studentId_sequence_key" ON "FeeInstallment"("studentId", "sequence");

-- CreateIndex
CREATE INDEX "Payment_installmentId_idx" ON "Payment"("installmentId");

-- AddForeignKey
ALTER TABLE "FeeInstallment" ADD CONSTRAINT "FeeInstallment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "FeeInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
