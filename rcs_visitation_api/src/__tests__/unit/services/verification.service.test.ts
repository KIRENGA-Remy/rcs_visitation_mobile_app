/**
 * Unit Tests: VerificationService
 * Tests all 8 QR scan guard conditions
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { VerificationService } from '../../../modules/verification/verification.service';
import { makeVisitRequest, makeVisitorProfile, makeSchedule, TEST_IDS } from '../../helpers/auth.helper';

const svc = new VerificationService();

const makeFullRequest = (overrides: any = {}) => ({
  ...makeVisitRequest({ status: 'APPROVED', qrCode: 'RCS-VALID123' }),
  visitorProfile: {
    ...makeVisitorProfile(),
    isBanned: false,
    bannedReason: null,
    user: { firstName: 'Amina', lastName: 'Uwase', nationalId: '119978', phone: '+250788', profilePhoto: null, status: 'ACTIVE' },
  },
  prisoner: { firstName: 'John', lastName: 'Doe', prisonerNumber: 'KGL-001', cellBlock: 'A', prison: { name: 'KGL 1930', code: 'KGL-1930' } },
  schedule: {
    ...makeSchedule(),
    startTime: new Date(Date.now() - 5 * 60 * 1000),   // started 5 min ago
    endTime:   new Date(Date.now() + 25 * 60 * 1000),  // ends in 25 min
    label: 'Morning Session',
  },
  visitLog: null,
  ...overrides,
});

describe('VerificationService.scanQrCode — 8 guard conditions', () => {

  // Guard 1: QR not found
  it('returns invalid when QR code does not exist', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(null);
    const result = await svc.scanQrCode({ qrCode: 'UNKNOWN-CODE' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  // Guard 2: QR expired
  it('returns invalid when QR code is expired', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({ qrCodeExpiresAt: new Date(Date.now() - 1000) }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  // Guard 3: CANCELLED
  it('returns invalid for CANCELLED request', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({ status: 'CANCELLED' }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('cancelled');
  });

  // Guard 4: REJECTED
  it('returns invalid for REJECTED request', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({ status: 'REJECTED', rejectionReason: 'Invalid ID' }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('rejected');
  });

  // Guard 5: COMPLETED
  it('returns invalid for already COMPLETED visit', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({ status: 'COMPLETED' }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('completed');
  });

  // Guard 6: CHECKED_IN
  it('returns invalid when visitor already checked in', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({ status: 'CHECKED_IN' }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('already checked in');
  });

  // Guard 7: Visitor banned
  it('returns invalid when visitor is banned', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({
        visitorProfile: { ...makeVisitorProfile(), isBanned: true, bannedReason: 'Security', user: { firstName: 'A', lastName: 'B', nationalId: null, phone: '', profilePhoto: null, status: 'ACTIVE' } },
      }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('banned');
  });

  // Guard 8: Schedule time window check (too early)
  it('returns invalid when arriving more than 15 min before slot', async () => {
    const futureStart = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({
        schedule: { startTime: futureStart, endTime: new Date(futureStart.getTime() + 3600000), label: 'Afternoon' },
      }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('opens at');
  });

  // Guard 8b: Slot passed
  it('returns invalid when slot time has completely passed', async () => {
    const pastEnd = new Date(Date.now() - 60 * 60 * 1000);
    prismaMock.visitRequest.findFirst.mockResolvedValue(
      makeFullRequest({
        schedule: { startTime: new Date(pastEnd.getTime() - 3600000), endTime: pastEnd, label: 'Past' },
      }) as any
    );
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('time has passed');
  });

  // Happy path: all guards pass
  it('returns valid:true when all 8 conditions are met', async () => {
    prismaMock.visitRequest.findFirst.mockResolvedValue(makeFullRequest() as any);
    const result = await svc.scanQrCode({ qrCode: 'RCS-VALID123' });
    expect(result.valid).toBe(true);
    expect(result.visitRequestId).toBe(TEST_IDS.visitRequest);
  });
});
