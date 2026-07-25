-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assignedPrisonId" TEXT;

-- CreateIndex
CREATE INDEX "users_assignedPrisonId_idx" ON "users"("assignedPrisonId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assignedPrisonId_fkey" FOREIGN KEY ("assignedPrisonId") REFERENCES "prisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
