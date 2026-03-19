/**
 * Auth Test Helpers
 * Generates JWT tokens for test users without hitting the database.
 */
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const SECRET = 'test-jwt-secret-min-32-chars-long!!';

export const makeToken = (payload: { id: string; role: UserRole; email: string }): string =>
  jwt.sign(payload, SECRET, { expiresIn: '1h' });

export const VISITOR_TOKEN  = makeToken({ id: 'visitor-id-1',  role: 'VISITOR',       email: 'visitor@test.rw' });
export const OFFICER_TOKEN  = makeToken({ id: 'officer-id-1',  role: 'PRISON_OFFICER', email: 'officer@test.rw' });
export const ADMIN_TOKEN    = makeToken({ id: 'admin-id-1',    role: 'ADMIN',          email: 'admin@test.rw' });

export const TEST_IDS = {
  visitor:        'visitor-id-1',
  officer:        'officer-id-1',
  admin:          'admin-id-1',
  visitorProfile: 'visitor-profile-id-1',
  prison:         'prison-id-1',
  prisoner:       'prisoner-id-1',
  schedule:       'schedule-id-1',
  visitRequest:   'visit-request-id-1',
  visitLog:       'visit-log-id-1',
  notification:   'notification-id-1',
};

export const makeUser = (overrides = {}) => ({
  id:           TEST_IDS.visitor,
  email:        'visitor@test.rw',
  phone:        '+250788000001',
  passwordHash: '$2b$12$hashedpassword',
  role:         'VISITOR' as UserRole,
  status:       'ACTIVE' as const,
  firstName:    'Amina',
  lastName:     'Uwase',
  nationalId:   '1199780012345678',
  gender:       'FEMALE' as const,
  dateOfBirth:  null,
  profilePhoto: null,
  preferredLang:'rw',
  emailVerified:false,
  phoneVerified:false,
  lastLoginAt:  null,
  createdAt:    new Date('2024-01-01'),
  updatedAt:    new Date('2024-01-01'),
  visitorProfile: null,
  ...overrides,
});

export const makePrison = (overrides = {}) => ({
  id:       TEST_IDS.prison,
  name:     'Kigali 1930 Prison',
  code:     'KGL-1930',
  district: 'Nyarugenge',
  sector:   'Nyamirambo',
  address:  'KG 7 Ave, Kigali',
  latitude: -1.9441,
  longitude: 30.0619,
  contactPhone: null, contactEmail: null,
  capacity: 2000,
  maxVisitorsPerSlot: 30,
  visitDurationMinutes: 30,
  maxVisitsPerPrisonerPerWeek: 2,
  visitingDaysConfig: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makePrisoner = (overrides = {}) => ({
  id:             TEST_IDS.prisoner,
  prisonId:       TEST_IDS.prison,
  prisonerNumber: 'KGL-2023-001',
  firstName:      'John',
  lastName:       'Doe',
  dateOfBirth:    null,
  gender:         'MALE' as const,
  nationalId:     null,
  cellBlock:      'Block A',
  cellNumber:     'A-12',
  status:         'ACTIVE' as const,
  admissionDate:  new Date('2023-01-15'),
  expectedReleaseDate: null,
  offenseCategory:null,
  visitingRestricted: false,
  restrictionReason:  null,
  restrictionUntil:   null,
  transferredFromPrisonId: null,
  transferredAt:  null,
  transferNotes:  null,
  totalVisitsReceived: 0,
  createdAt:      new Date('2023-01-15'),
  updatedAt:      new Date('2023-01-15'),
  ...overrides,
});

export const makeSchedule = (overrides = {}) => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
  const end   = new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3h
  return {
    id:             TEST_IDS.schedule,
    prisonId:       TEST_IDS.prison,
    date:           start,
    startTime:      start,
    endTime:        end,
    label:          'Morning Session',
    maxCapacity:    30,
    currentBookings:0,
    status:         'OPEN' as const,
    visitType:      'REGULAR' as const,
    createdByUserId:TEST_IDS.admin,
    notes:          null,
    createdAt:      new Date('2024-01-01'),
    updatedAt:      new Date('2024-01-01'),
    ...overrides,
  };
};

export const makeVisitorProfile = (overrides = {}) => ({
  id:                  TEST_IDS.visitorProfile,
  userId:              TEST_IDS.visitor,
  totalVisitsCount:    0,
  lastVisitAt:         null,
  emergencyContactName:  null,
  emergencyContactPhone: null,
  district:            'Gasabo',
  sector:              'Remera',
  cell:                null,
  isBanned:            false,
  bannedReason:        null,
  bannedAt:            null,
  bannedUntil:         null,
  createdAt:           new Date('2024-01-01'),
  updatedAt:           new Date('2024-01-01'),
  ...overrides,
});

export const makeVisitRequest = (overrides = {}) => ({
  id:               TEST_IDS.visitRequest,
  visitorProfileId: TEST_IDS.visitorProfile,
  prisonerId:       TEST_IDS.prisoner,
  scheduleId:       TEST_IDS.schedule,
  visitType:        'REGULAR' as const,
  purposeNote:      null,
  numberOfAdults:   1,
  numberOfChildren: 0,
  status:           'PENDING' as const,
  rejectionReason:  null,
  cancellationReason:null,
  cancelledAt:      null,
  processedByUserId:null,
  processedAt:      null,
  qrCode:           null,
  qrCodeExpiresAt:  null,
  checkedInAt:      null,
  checkedOutAt:     null,
  actualDurationMins: null,
  referenceNumber:  'clabcdef123',
  createdAt:        new Date('2024-01-01'),
  updatedAt:        new Date('2024-01-01'),
  ...overrides,
});
