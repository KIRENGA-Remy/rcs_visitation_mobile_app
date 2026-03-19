/**
 * Unit Tests: VisitLogService
 * Tests: check-in guards (status, duplicate, QR expiry), check-out guards, incident flagging
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { VisitLogService } from '../../../modules/visit-logs/visit-log.service';
import { makeVisitRequest, makeVisitorProfile, TEST_IDS } from '../../helpers/auth.helper';

const svc = new VisitLogService();

const CHECK_IN_DTO = {
  visitRequestId:       TEST_IDS.visitRequest,
  actualAdultsPresent:  1,
  actualChildrenPresent:0,
};

const makeLog = (overrides: any = {}) => ({
  id:                   TEST_IDS.visitLog,
  visitRequestId:       TEST_IDS.visitRequest,
  conductedByUserId:    TEST_IDS.officer,
  actualCheckinTime:    new Date(Date.now() - 25 * 60 * 1000),
  actualCheckoutTime:   null,
  durationMinutes:      null,
  actualAdultsPresent:  1,
  actualChildrenPresent:0,
  incidentType:         'NONE',
  incidentNotes:        null,
  incidentFlagged:      false,
  flaggedAt:            null,
  officerNotes:         null,
  visitQuality:         null,
  itemsCarriedIn:       null,
  itemsConfiscated:     null,
  isAmended:            false,
  amendmentReason:      null,
  amendedAt:            null,
  amendedByUserId:      null,
  createdAt:            new Date(),
  updatedAt:            new Date(),
  visitRequest: makeVisitRequest({ status: 'CHECKED_IN', visitorProfileId: TEST_IDS.visitorProfile }),
  ...overrides,
});

describe('VisitLogService.checkIn', () => {

  it('throws when request status is not APPROVED', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ status: 'PENDING', visitLog: null }) as any
    );
    await expect(svc.checkIn(CHECK_IN_DTO, TEST_IDS.officer))
      .rejects.toThrow('Only approved requests');
  });

  it('throws when visitor is already checked in (visitLog exists)', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ status: 'APPROVED', visitLog: { id: 'existing-log' } }) as any
    );
    await expect(svc.checkIn(CHECK_IN_DTO, TEST_IDS.officer))
      .rejects.toThrow('already checked in');
  });

  it('throws when QR code is expired', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({
        status: 'APPROVED',
        visitLog: null,
        qrCodeExpiresAt: new Date(Date.now() - 60 * 1000), // expired 1 min ago
      }) as any
    );
    await expect(svc.checkIn(CHECK_IN_DTO, TEST_IDS.officer))
      .rejects.toThrow('QR code has expired');
  });

  it('performs check-in successfully via transaction', async () => {
    prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
      makeVisitRequest({ status: 'APPROVED', visitLog: null, qrCodeExpiresAt: null }) as any
    );
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        visitLog:    { create: jest.fn().mockResolvedValue(makeLog()) },
        visitRequest:{ update: jest.fn().mockResolvedValue({}) },
        prisoner:    { update: jest.fn().mockResolvedValue({}) },
      })
    );
    await svc.checkIn(CHECK_IN_DTO, TEST_IDS.officer);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

describe('VisitLogService.checkOut', () => {

  it('throws when visit is already checked out', async () => {
    prismaMock.visitLog.findUniqueOrThrow.mockResolvedValue(
      makeLog({ actualCheckoutTime: new Date() }) as any
    );
    await expect(svc.checkOut(TEST_IDS.visitLog, { incidentType: 'NONE' }, TEST_IDS.officer))
      .rejects.toThrow('already checked out');
  });

  it('throws when visit request status is not CHECKED_IN', async () => {
    prismaMock.visitLog.findUniqueOrThrow.mockResolvedValue(
      makeLog({ visitRequest: makeVisitRequest({ status: 'APPROVED' }) }) as any
    );
    await expect(svc.checkOut(TEST_IDS.visitLog, { incidentType: 'NONE' }, TEST_IDS.officer))
      .rejects.toThrow('not currently checked in');
  });

  it('flags incident when incidentType is not NONE', async () => {
    prismaMock.visitLog.findUniqueOrThrow.mockResolvedValue(makeLog() as any);
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        visitLog:       { update: jest.fn().mockResolvedValue(makeLog({ incidentFlagged: true })) },
        visitRequest:   { update: jest.fn().mockResolvedValue({}) },
        visitorProfile: { update: jest.fn().mockResolvedValue({}) },
      })
    );
    await svc.checkOut(TEST_IDS.visitLog, { incidentType: 'CONTRABAND', incidentNotes: 'Found item' }, TEST_IDS.officer);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('completes checkout and updates visitor totalVisitsCount', async () => {
    prismaMock.visitLog.findUniqueOrThrow.mockResolvedValue(makeLog() as any);
    const visitorProfileUpdate = jest.fn().mockResolvedValue({});
    prismaMock.$transaction.mockImplementation(async (fn: any) =>
      fn({
        visitLog:       { update: jest.fn().mockResolvedValue(makeLog({ actualCheckoutTime: new Date() })) },
        visitRequest:   { update: jest.fn().mockResolvedValue({}) },
        visitorProfile: { update: visitorProfileUpdate },
      })
    );
    await svc.checkOut(TEST_IDS.visitLog, { incidentType: 'NONE' }, TEST_IDS.officer);
    expect(visitorProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalVisitsCount: { increment: 1 } }),
      })
    );
  });
});
