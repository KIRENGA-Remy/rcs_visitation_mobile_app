-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_SUBMITTED';

-- CreateEnum
CREATE TYPE "ReportRequestStatus" AS ENUM ('PENDING', 'FULFILLED');

-- CreateTable
CREATE TABLE "report_requests" (
    "id" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "targetOfficerId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" "ReportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officer_reports" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "visitLogId" TEXT,
    "reportRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officer_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_requests_targetOfficerId_idx" ON "report_requests"("targetOfficerId");

-- CreateIndex
CREATE INDEX "report_requests_requestedByUserId_idx" ON "report_requests"("requestedByUserId");

-- CreateIndex
CREATE INDEX "report_requests_status_idx" ON "report_requests"("status");

-- CreateIndex
CREATE INDEX "officer_reports_officerId_idx" ON "officer_reports"("officerId");

-- CreateIndex
CREATE INDEX "officer_reports_reportRequestId_idx" ON "officer_reports"("reportRequestId");

-- AddForeignKey
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_requests" ADD CONSTRAINT "report_requests_targetOfficerId_fkey" FOREIGN KEY ("targetOfficerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officer_reports" ADD CONSTRAINT "officer_reports_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officer_reports" ADD CONSTRAINT "officer_reports_reportRequestId_fkey" FOREIGN KEY ("reportRequestId") REFERENCES "report_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
