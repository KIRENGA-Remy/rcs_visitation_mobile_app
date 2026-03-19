-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VISITOR', 'PRISON_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PrisonerStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'RELEASED', 'RESTRICTED', 'DECEASED');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "VisitRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('OPEN', 'FULL', 'CANCELLED', 'CLOSED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "VisitLogIncidentType" AS ENUM ('NONE', 'CONTRABAND', 'BEHAVIOUR', 'OVERSTAY', 'UNAUTHORIZED', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VISIT_APPROVED', 'VISIT_REJECTED', 'VISIT_REMINDER', 'VISIT_CANCELLED', 'VISIT_CHECKED_IN', 'VISIT_COMPLETED', 'PRISONER_TRANSFERRED', 'SLOT_OPENING', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VISITOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "nationalId" TEXT,
    "profilePhoto" TEXT,
    "preferredLang" TEXT NOT NULL DEFAULT 'rw',
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalVisitsCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "cell" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "bannedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approved_visitor_prisoners" (
    "id" TEXT NOT NULL,
    "visitorProfileId" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "approved_visitor_prisoners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "sector" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxVisitorsPerSlot" INTEGER NOT NULL DEFAULT 20,
    "visitDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxVisitsPerPrisonerPerWeek" INTEGER NOT NULL DEFAULT 2,
    "visitingDaysConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisoners" (
    "id" TEXT NOT NULL,
    "prisonId" TEXT NOT NULL,
    "prisonerNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL,
    "nationalId" TEXT,
    "cellBlock" TEXT,
    "cellNumber" TEXT,
    "status" "PrisonerStatus" NOT NULL DEFAULT 'ACTIVE',
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "expectedReleaseDate" TIMESTAMP(3),
    "offenseCategory" TEXT,
    "visitingRestricted" BOOLEAN NOT NULL DEFAULT false,
    "restrictionReason" TEXT,
    "restrictionUntil" TIMESTAMP(3),
    "transferredFromPrisonId" TEXT,
    "transferredAt" TIMESTAMP(3),
    "transferNotes" TEXT,
    "totalVisitsReceived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prisoners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_schedules" (
    "id" TEXT NOT NULL,
    "prisonId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'OPEN',
    "visitType" "VisitType" NOT NULL DEFAULT 'REGULAR',
    "createdByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_requests" (
    "id" TEXT NOT NULL,
    "visitorProfileId" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "visitType" "VisitType" NOT NULL DEFAULT 'REGULAR',
    "purposeNote" TEXT,
    "numberOfAdults" INTEGER NOT NULL DEFAULT 1,
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "status" "VisitRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "processedByUserId" TEXT,
    "processedAt" TIMESTAMP(3),
    "qrCode" TEXT,
    "qrCodeExpiresAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "actualDurationMins" INTEGER,
    "referenceNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_logs" (
    "id" TEXT NOT NULL,
    "visitRequestId" TEXT NOT NULL,
    "conductedByUserId" TEXT NOT NULL,
    "actualCheckinTime" TIMESTAMP(3) NOT NULL,
    "actualCheckoutTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "actualAdultsPresent" INTEGER NOT NULL DEFAULT 0,
    "actualChildrenPresent" INTEGER NOT NULL DEFAULT 0,
    "incidentType" "VisitLogIncidentType" NOT NULL DEFAULT 'NONE',
    "incidentNotes" TEXT,
    "incidentFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flaggedAt" TIMESTAMP(3),
    "officerNotes" TEXT,
    "visitQuality" TEXT,
    "itemsCarriedIn" TEXT,
    "itemsConfiscated" TEXT,
    "isAmended" BOOLEAN NOT NULL DEFAULT false,
    "amendmentReason" TEXT,
    "amendedAt" TIMESTAMP(3),
    "amendedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "visitRequestId" TEXT,
    "deliveryMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_nationalId_idx" ON "users"("nationalId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_profiles_userId_key" ON "visitor_profiles"("userId");

-- CreateIndex
CREATE INDEX "visitor_profiles_userId_idx" ON "visitor_profiles"("userId");

-- CreateIndex
CREATE INDEX "visitor_profiles_isBanned_idx" ON "visitor_profiles"("isBanned");

-- CreateIndex
CREATE INDEX "approved_visitor_prisoners_prisonerId_idx" ON "approved_visitor_prisoners"("prisonerId");

-- CreateIndex
CREATE UNIQUE INDEX "approved_visitor_prisoners_visitorProfileId_prisonerId_key" ON "approved_visitor_prisoners"("visitorProfileId", "prisonerId");

-- CreateIndex
CREATE UNIQUE INDEX "prisons_name_key" ON "prisons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prisons_code_key" ON "prisons"("code");

-- CreateIndex
CREATE INDEX "prisons_code_idx" ON "prisons"("code");

-- CreateIndex
CREATE INDEX "prisons_district_idx" ON "prisons"("district");

-- CreateIndex
CREATE UNIQUE INDEX "prisoners_prisonerNumber_key" ON "prisoners"("prisonerNumber");

-- CreateIndex
CREATE INDEX "prisoners_prisonId_idx" ON "prisoners"("prisonId");

-- CreateIndex
CREATE INDEX "prisoners_prisonerNumber_idx" ON "prisoners"("prisonerNumber");

-- CreateIndex
CREATE INDEX "prisoners_status_idx" ON "prisoners"("status");

-- CreateIndex
CREATE INDEX "visit_schedules_prisonId_date_idx" ON "visit_schedules"("prisonId", "date");

-- CreateIndex
CREATE INDEX "visit_schedules_status_idx" ON "visit_schedules"("status");

-- CreateIndex
CREATE INDEX "visit_schedules_startTime_idx" ON "visit_schedules"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "visit_requests_qrCode_key" ON "visit_requests"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "visit_requests_referenceNumber_key" ON "visit_requests"("referenceNumber");

-- CreateIndex
CREATE INDEX "visit_requests_visitorProfileId_idx" ON "visit_requests"("visitorProfileId");

-- CreateIndex
CREATE INDEX "visit_requests_prisonerId_idx" ON "visit_requests"("prisonerId");

-- CreateIndex
CREATE INDEX "visit_requests_scheduleId_idx" ON "visit_requests"("scheduleId");

-- CreateIndex
CREATE INDEX "visit_requests_status_idx" ON "visit_requests"("status");

-- CreateIndex
CREATE INDEX "visit_requests_referenceNumber_idx" ON "visit_requests"("referenceNumber");

-- CreateIndex
CREATE INDEX "visit_requests_qrCode_idx" ON "visit_requests"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "visit_requests_visitorProfileId_prisonerId_scheduleId_key" ON "visit_requests"("visitorProfileId", "prisonerId", "scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "visit_logs_visitRequestId_key" ON "visit_logs"("visitRequestId");

-- CreateIndex
CREATE INDEX "visit_logs_visitRequestId_idx" ON "visit_logs"("visitRequestId");

-- CreateIndex
CREATE INDEX "visit_logs_conductedByUserId_idx" ON "visit_logs"("conductedByUserId");

-- CreateIndex
CREATE INDEX "visit_logs_incidentFlagged_idx" ON "visit_logs"("incidentFlagged");

-- CreateIndex
CREATE INDEX "visit_logs_actualCheckinTime_idx" ON "visit_logs"("actualCheckinTime");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_scope_key_key" ON "settings"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- AddForeignKey
ALTER TABLE "visitor_profiles" ADD CONSTRAINT "visitor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approved_visitor_prisoners" ADD CONSTRAINT "approved_visitor_prisoners_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "visitor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approved_visitor_prisoners" ADD CONSTRAINT "approved_visitor_prisoners_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "prisoners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prisoners" ADD CONSTRAINT "prisoners_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "prisons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_schedules" ADD CONSTRAINT "visit_schedules_prisonId_fkey" FOREIGN KEY ("prisonId") REFERENCES "prisons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "visitor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "prisoners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "visit_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_visitRequestId_fkey" FOREIGN KEY ("visitRequestId") REFERENCES "visit_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_conductedByUserId_fkey" FOREIGN KEY ("conductedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_visitRequestId_fkey" FOREIGN KEY ("visitRequestId") REFERENCES "visit_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
