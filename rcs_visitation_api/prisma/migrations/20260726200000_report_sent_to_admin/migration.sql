-- AlterTable
ALTER TABLE "officer_reports" ADD COLUMN "sentToAdminId" TEXT;

-- CreateIndex
CREATE INDEX "officer_reports_sentToAdminId_idx" ON "officer_reports"("sentToAdminId");

-- AddForeignKey
ALTER TABLE "officer_reports" ADD CONSTRAINT "officer_reports_sentToAdminId_fkey" FOREIGN KEY ("sentToAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
