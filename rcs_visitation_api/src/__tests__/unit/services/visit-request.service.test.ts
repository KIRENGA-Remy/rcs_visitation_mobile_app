/**
 * Unit Tests: VisitRequestService
 * Tests all business rules: banned visitor, inactive prisoner, restricted prisoner,
 * full slot, past slot, duplicate booking, approval/rejection, cancellation
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { VisitRequestService } from '../../../modules/visit-requests/visit-request.service';
import {
  makeVisitorProfile, makePrisoner, makeSchedule,
  makeVisitRequest, makeUser, TEST_IDS,
} from '../../helpers/auth.helper';

const svc = new VisitRequestService();

const CREATE_DTO = {
  prisonerId:       TEST_IDS.prisoner,
  scheduleId:       TEST_IDS.schedule,
  visitType:        'REGULAR' as const,
  numberOfAdults:   1,
  numberOfChildren: 0,
};

// Helper: set up the happy path mocks
const setupHappyPath = () => {
  prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
  prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
  prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(makeSchedule() as any);
  prismaMock.visitRequest.findFirst.mockResolvedValue(null);
  prismaMock.$transaction.mockImplementation(async (fn: any) =>
    fn({
      visitRequest: { create: jest.fn().mockResolvedValue(makeVisitRequest()) },
      visitSchedule: { update: jest.fn().mockResolvedValue({}) },
    })
  );
};

describe('VisitRequestService.create — business rule validation', () => {

  it('throws when visitor profile not found', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(null);
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('Visitor profile not found');
  });

  it('throws when visitor is banned', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(
      makeVisitorProfile({ isBanned: true, bannedReason: 'Security concern' }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('banned');
  });

  it('throws when prisoner status is RELEASED', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(
      makePrisoner({ status: 'RELEASED' }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('not currently accepting visits');
  });

  it('throws when prisoner visits are restricted (no expiry)', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(
      makePrisoner({ visitingRestricted: true, restrictionReason: 'Disciplinary', restrictionUntil: null }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('restricted');
  });

  it('throws when prisoner restriction is still active (future expiry)', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(
      makePrisoner({ visitingRestricted: true, restrictionUntil: futureDate }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('restricted');
  });

  it('throws when schedule belongs to different prison than prisoner', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(
      makePrisoner({ prisonId: 'different-prison-id' }) as any
    );
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(
      makeSchedule({ prisonId: TEST_IDS.prison }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow("prisoner's prison");
  });

  it('throws when schedule is FULL', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(
      makeSchedule({ status: 'FULL' }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('not available');
  });

  it('throws when schedule is CANCELLED', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(
      makeSchedule({ status: 'CANCELLED' }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('not available');
  });

  it('throws when schedule capacity is reached', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(
      makeSchedule({ maxCapacity: 30, currentBookings: 30 }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('fully booked');
  });

  it('throws when schedule start time is in the past', async () => {
    const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(
      makeSchedule({ startTime: pastTime }) as any
    );
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('past');
  });

  it('throws when visitor already has active booking for same prisoner+slot', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
    prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
    prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(makeSchedule() as any);
    prismaMock.visitRequest.findFirst.mockResolvedValue(makeVisitRequest() as any); // duplicate!
    await expect(svc.create(CREATE_DTO, TEST_IDS.visitor)).rejects.toThrow('already have an active booking');
  });

  it('creates the visit request successfully on happy path', async () => {
    setupHappyPath();
    const result = await svc.create(CREATE_DTO, TEST_IDS.visitor);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

describe('VisitRequestService.processRequest', () => {
  it('throws when request is not PENDING', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ status: 'APPROVED' }) as any
    );
    await expect(svc.processRequest(TEST_IDS.visitRequest, { action: 'APPROVE' }, TEST_IDS.officer))
      .rejects.toThrow('Only pending');
  });

  it('approves the request and generates QR code', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(makeVisitRequest() as any);
    prismaMock.visitRequest.update.mockResolvedValue(
      makeVisitRequest({ status: 'APPROVED', qrCode: 'RCS-ABCD123' }) as any
    );
    await svc.processRequest(TEST_IDS.visitRequest, { action: 'APPROVE' }, TEST_IDS.officer);
    const updateCall = prismaMock.visitRequest.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('APPROVED');
    expect(updateCall.data.qrCode).toBeTruthy();
    expect(updateCall.data.qrCodeExpiresAt).toBeInstanceOf(Date);
  });

  it('rejects the request and clears QR code', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(makeVisitRequest() as any);
    prismaMock.visitRequest.update.mockResolvedValue(makeVisitRequest({ status: 'REJECTED' }) as any);
    await svc.processRequest(TEST_IDS.visitRequest, { action: 'REJECT', rejectionReason: 'Invalid ID' }, TEST_IDS.officer);
    const updateCall = prismaMock.visitRequest.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('REJECTED');
    expect(updateCall.data.qrCode).toBeNull();
    expect(updateCall.data.rejectionReason).toBe('Invalid ID');
  });
});

describe('VisitRequestService.cancel', () => {
  it('throws when request is already COMPLETED', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ status: 'COMPLETED', visitorProfile: makeVisitorProfile() }) as any
    );
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ role: 'VISITOR' }) as any);
    await expect(svc.cancel(TEST_IDS.visitRequest, { cancellationReason: 'Changed mind' }, TEST_IDS.visitor))
      .rejects.toThrow('cannot be cancelled');
  });

  it('throws when VISITOR tries to cancel another visitor request', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ visitorProfile: makeVisitorProfile({ userId: 'other-user-id' }) }) as any
    );
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ role: 'VISITOR' }) as any);
    await expect(svc.cancel(TEST_IDS.visitRequest, { cancellationReason: 'Test' }, TEST_IDS.visitor))
      .rejects.toThrow('Cannot cancel');
  });
});
