// ─── Core Enums (matching backend Prisma schema exactly) ───────────────────

export type UserRole = 'VISITOR' | 'PRISON_OFFICER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PrisonerStatus = 'ACTIVE' | 'TRANSFERRED' | 'RELEASED' | 'RESTRICTED' | 'DECEASED';
export type VisitType = 'REGULAR' | 'LEGAL' | 'MEDICAL' | 'OFFICIAL';
export type VisitRequestStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'EXPIRED';
export type ScheduleStatus = 'OPEN' | 'FULL' | 'CANCELLED' | 'CLOSED' | 'RESTRICTED';
export type VisitLogIncidentType =
  | 'NONE' | 'CONTRABAND' | 'BEHAVIOUR' | 'OVERSTAY' | 'UNAUTHORIZED' | 'OTHER';
export type NotificationType =
  | 'VISIT_APPROVED' | 'VISIT_REJECTED' | 'VISIT_REMINDER' | 'VISIT_CANCELLED'
  | 'VISIT_CHECKED_IN' | 'VISIT_COMPLETED' | 'PRISONER_TRANSFERRED'
  | 'SLOT_OPENING' | 'SYSTEM_ALERT';
export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL';

// ─── API Response wrapper ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  nationalId?: string;
  profilePhoto?: string;
  preferredLang: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  visitorProfile?: VisitorProfileSummary;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ─── Visitor Profile ───────────────────────────────────────────────────────
export interface VisitorProfileSummary {
  id: string;
  district?: string;
  isBanned: boolean;
  totalVisitsCount: number;
  lastVisitAt?: string;
}

export interface VisitorProfile {
  id: string;
  district?: string;
  sector?: string;
  cell?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isBanned: boolean;
  bannedReason?: string;
  bannedAt?: string;
  bannedUntil?: string;
  totalVisitsCount: number;
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    gender?: Gender;
    nationalId?: string;
    profilePhoto?: string;
    status: UserStatus;
  };
  approvedPrisoners: ApprovedPrisoner[];
}

export interface ApprovedPrisoner {
  id: string;
  relationship: string;
  approvedAt: string;
  prisoner: {
    id: string;
    prisonerNumber: string;
    firstName: string;
    lastName: string;
    prison: { name: string; code: string };
  };
}

// ─── Prison ────────────────────────────────────────────────────────────────
export interface Prison {
  id: string;
  name: string;
  code: string;
  district: string;
  sector?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  capacity: number;
  maxVisitorsPerSlot: number;
  visitDurationMinutes: number;
  maxVisitsPerPrisonerPerWeek: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Prisoner ──────────────────────────────────────────────────────────────
export interface Prisoner {
  id: string;
  prisonId: string;
  prisonerNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: Gender;
  cellBlock?: string;
  cellNumber?: string;
  status: PrisonerStatus;
  admissionDate: string;
  visitingRestricted: boolean;
  restrictionReason?: string;
  totalVisitsReceived: number;
  prison: { name: string; code: string; district: string };
}

// ─── Visit Schedule ────────────────────────────────────────────────────────
export interface VisitSchedule {
  id: string;
  prisonId: string;
  date: string;
  startTime: string;
  endTime: string;
  label?: string;
  maxCapacity: number;
  currentBookings: number;
  availableSlots: number;
  status: ScheduleStatus;
  visitType: VisitType;
  notes?: string;
  prison: { name: string; code: string };
}

// ─── Visit Request ─────────────────────────────────────────────────────────
export interface VisitRequest {
  id: string;
  visitorProfileId: string;
  prisonerId: string;
  scheduleId: string;
  visitType: VisitType;
  purposeNote?: string;
  numberOfAdults: number;
  numberOfChildren: number;
  status: VisitRequestStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  processedByUserId?: string;
  processedAt?: string;
  qrCode?: string;
  qrCodeExpiresAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  actualDurationMins?: number;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  prisoner?: { firstName: string; lastName: string; prisonerNumber: string; cellBlock?: string };
  schedule?: { startTime: string; endTime: string; label?: string; prison?: { name: string; code: string } };
  visitorProfile?: { user: { firstName: string; lastName: string; phone: string; nationalId?: string } };
  processedBy?: { firstName: string; lastName: string };
  visitLog?: VisitLog;
}

// ─── Visit Log ─────────────────────────────────────────────────────────────
export interface VisitLog {
  id: string;
  visitRequestId: string;
  conductedByUserId: string;
  actualCheckinTime: string;
  actualCheckoutTime?: string;
  durationMinutes?: number;
  actualAdultsPresent: number;
  actualChildrenPresent: number;
  incidentType: VisitLogIncidentType;
  incidentNotes?: string;
  incidentFlagged: boolean;
  flaggedAt?: string;
  officerNotes?: string;
  visitQuality?: string;
  itemsCarriedIn?: string;
  itemsConfiscated?: string;
  createdAt: string;
}

// ─── Notification ──────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  isSent: boolean;
  sentAt?: string;
  visitRequestId?: string;
  createdAt: string;
}

// ─── Reports ───────────────────────────────────────────────────────────────
export interface OverviewStats {
  prisons: { total: number };
  prisoners: { total: number; active: number };
  visitRequests: { total: number; pending: number; approvedToday: number };
  todayCheckins: number;
  flaggedIncidents: number;
  users: { total: number; visitors: number };
}

export interface DailyVisit {
  date: string;
  totalVisits: number;
  totalVisitors: number;
  incidents: number;
  avgDurationMins: number;
}

export interface PeakHour {
  hour: number;
  label: string;
  visitCount: number;
}

export interface PrisonerActivity {
  prisonerId: string;
  visitCount: number;
  prisoner: { firstName: string; lastName: string; prisonerNumber: string; prison: { name: string; code: string } };
}

// ─── User (Admin view) ─────────────────────────────────────────────────────
export interface UserAdmin {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  nationalId?: string;
  createdAt: string;
  visitorProfile?: VisitorProfileSummary;
}

// ─── Form DTOs ─────────────────────────────────────────────────────────────
export interface RegisterDto {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId?: string;
  gender?: Gender;
}

export interface LoginDto {
  emailOrPhone: string;
  password: string;
}

export interface CreateVisitRequestDto {
  prisonerId: string;
  scheduleId: string;
  visitType: VisitType;
  purposeNote?: string;
  numberOfAdults: number;
  numberOfChildren: number;
}

export interface CheckInDto {
  visitRequestId: string;
  actualAdultsPresent: number;
  actualChildrenPresent: number;
  itemsCarriedIn?: string;
  officerNotes?: string;
}

export interface CheckOutDto {
  incidentType: VisitLogIncidentType;
  incidentNotes?: string;
  itemsConfiscated?: string;
  officerNotes?: string;
  visitQuality?: 'NORMAL' | 'TENSE' | 'EMOTIONAL';
}
