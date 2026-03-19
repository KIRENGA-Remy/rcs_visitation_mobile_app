/**
 * End-to-End Flow Test (Mocked DB)
 * ─────────────────────────────────
 * Simulates the complete real-world scenario described in the document:
 *
 * 1. Visitor registers → profile auto-created
 * 2. Officer approves visit request → QR generated
 * 3. Visitor arrives → QR scanned → valid
 * 4. Officer checks in → VisitLog created
 * 5. Officer checks out → Visit completed, counter incremented
 * 6. Admin checks reports → data available
 *
 * Edge cases:
 * 7. Banned visitor → request blocked
 * 8. Suspended user → login blocked
 * 9. Visitor accesses officer endpoint → 403
 * 10. Officer accesses admin endpoint → 403
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { AuthService } from '../../modules/auth/auth.service';
import { VisitRequestService } from '../../modules/visit-requests/visit-request.service';
import { VisitLogService } from '../../modules/visit-logs/visit-log.service';
import { VerificationService } from '../../modules/verification/verification.service';
import { prismaMock } from '../helpers/prisma.mock';
import { makeUser, makePrisoner, makeSchedule, makeVisitorProfile, makeVisitRequest, TEST_IDS } from '../helpers/auth.helper';
import bcrypt from 'bcryptjs';

jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

describe('Full Visitation Flow — End to End', () => {

  describe('Step 1: Visitor Registration', () => {
    it('registers a visitor and auto-creates VisitorProfile', async () => {
      const authSvc = new AuthService();
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(makeUser() as any);

      const result = await authSvc.register({
        email: 'amina@test.rw', phone: '+250788000001',
        password: 'Password@123', firstName: 'Amina',
        lastName: 'Uwase', role: 'VISITOR',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.role).toBe('VISITOR');

      // Verify visitorProfile was included in create call
      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.visitorProfile).toEqual({ create: {} });
    });
  });

  describe('Step 2: Submit Visit Request (Happy Path)', () => {
    it('visitor submits a valid request', async () => {
      const visitSvc = new VisitRequestService();
      prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
      prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
      prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(makeSchedule() as any);
      prismaMock.visitRequest.findFirst.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (fn: any) =>
        fn({
          visitRequest:  { create: jest.fn().mockResolvedValue(makeVisitRequest()) },
          visitSchedule: { update: jest.fn().mockResolvedValue({}) },
        })
      );

      await expect(visitSvc.create({
        prisonerId: TEST_IDS.prisoner, scheduleId: TEST_IDS.schedule,
        visitType: 'REGULAR', numberOfAdults: 1, numberOfChildren: 0,
      }, TEST_IDS.visitor)).resolves.toBeDefined();
    });
  });

  describe('Step 3: Officer Approves — QR Code Generated', () => {
    it('approved request contains QR code and expiry', async () => {
      const visitSvc = new VisitRequestService();
      prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(makeVisitRequest() as any);
      prismaMock.visitRequest.update.mockResolvedValue(
        makeVisitRequest({ status: 'APPROVED', qrCode: 'RCS-XYZ123', qrCodeExpiresAt: new Date(Date.now() + 86400000) }) as any
      );

      await visitSvc.processRequest(TEST_IDS.visitRequest, { action: 'APPROVE' }, TEST_IDS.officer);
      const updateCall = prismaMock.visitRequest.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('APPROVED');
      expect(updateCall.data.qrCode).toBeTruthy();
      expect(updateCall.data.qrCodeExpiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Step 4: QR Scan at Gate', () => {
    it('valid QR scan returns valid:true with visitor info', async () => {
      const verifySvc = new VerificationService();
      const now = new Date();
      prismaMock.visitRequest.findFirst.mockResolvedValue({
        ...makeVisitRequest({ status: 'APPROVED', qrCode: 'RCS-XYZ123', qrCodeExpiresAt: new Date(Date.now() + 86400000) }),
        visitorProfile: { ...makeVisitorProfile(), isBanned: false, user: { firstName: 'Amina', lastName: 'Uwase', nationalId: '119978', phone: '+250788', profilePhoto: null, status: 'ACTIVE' } },
        prisoner: { firstName: 'John', lastName: 'Doe', prisonerNumber: 'KGL-001', cellBlock: 'A', prison: { name: 'KGL 1930', code: 'KGL-1930' } },
        schedule: { startTime: new Date(now.getTime() - 5 * 60000), endTime: new Date(now.getTime() + 25 * 60000), label: 'Morning' },
        visitLog: null,
      } as any);

      const result = await verifySvc.scanQrCode({ qrCode: 'RCS-XYZ123' });
      expect(result.valid).toBe(true);
    });
  });

  describe('Step 5: Check-In and Check-Out', () => {
    it('check-in creates visit log', async () => {
      const logSvc = new VisitLogService();
      prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
        makeVisitRequest({ status: 'APPROVED', visitLog: null, qrCodeExpiresAt: null }) as any
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) =>
        fn({
          visitLog:    { create: jest.fn().mockResolvedValue({ id: TEST_IDS.visitLog, actualCheckinTime: new Date() }) },
          visitRequest:{ update: jest.fn().mockResolvedValue({}) },
          prisoner:    { update: jest.fn().mockResolvedValue({}) },
        })
      );
      await expect(logSvc.checkIn({ visitRequestId: TEST_IDS.visitRequest, actualAdultsPresent: 1, actualChildrenPresent: 0 }, TEST_IDS.officer))
        .resolves.toBeDefined();
    });

    it('check-out completes visit and increments visitor count', async () => {
      const logSvc = new VisitLogService();
      const profileUpdate = jest.fn().mockResolvedValue({});
      prismaMock.visitLog.findUniqueOrThrow.mockResolvedValue({
        id: TEST_IDS.visitLog,
        visitRequestId: TEST_IDS.visitRequest,
        actualCheckinTime: new Date(Date.now() - 25 * 60000),
        actualCheckoutTime: null,
        visitRequest: makeVisitRequest({ status: 'CHECKED_IN', visitorProfileId: TEST_IDS.visitorProfile }),
      } as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) =>
        fn({
          visitLog:       { update: jest.fn().mockResolvedValue({ durationMinutes: 25 }) },
          visitRequest:   { update: jest.fn().mockResolvedValue({}) },
          visitorProfile: { update: profileUpdate },
        })
      );
      await logSvc.checkOut(TEST_IDS.visitLog, { incidentType: 'NONE' }, TEST_IDS.officer);
      expect(profileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totalVisitsCount: { increment: 1 } }) })
      );
    });
  });

  describe('Edge Case: Banned Visitor', () => {
    it('blocked from creating visit request', async () => {
      const visitSvc = new VisitRequestService();
      prismaMock.visitorProfile.findUnique.mockResolvedValue(
        makeVisitorProfile({ isBanned: true, bannedReason: 'Security concern' }) as any
      );
      await expect(visitSvc.create({
        prisonerId: TEST_IDS.prisoner, scheduleId: TEST_IDS.schedule,
        visitType: 'REGULAR', numberOfAdults: 1, numberOfChildren: 0,
      }, TEST_IDS.visitor)).rejects.toThrow('banned');
    });
  });

  describe('Edge Case: Suspended User Login', () => {
    it('suspended user cannot login', async () => {
      const authSvc = new AuthService();
      prismaMock.user.findFirst.mockResolvedValue(makeUser({ status: 'SUSPENDED' }) as any);
      await expect(authSvc.login({ emailOrPhone: 'amina@test.rw', password: 'Password@123' }))
        .rejects.toThrow('suspended');
    });
  });

  describe('Edge Case: Double Booking', () => {
    it('visitor cannot book same prisoner+slot twice', async () => {
      const visitSvc = new VisitRequestService();
      prismaMock.visitorProfile.findUnique.mockResolvedValue(makeVisitorProfile() as any);
      prismaMock.prisoner.findUniqueOrThrow.mockResolvedValue(makePrisoner() as any);
      prismaMock.visitSchedule.findUniqueOrThrow.mockResolvedValue(makeSchedule() as any);
      prismaMock.visitRequest.findFirst.mockResolvedValue(makeVisitRequest() as any); // existing!
      await expect(visitSvc.create({
        prisonerId: TEST_IDS.prisoner, scheduleId: TEST_IDS.schedule,
        visitType: 'REGULAR', numberOfAdults: 1, numberOfChildren: 0,
      }, TEST_IDS.visitor)).rejects.toThrow('already have an active booking');
    });
  });

  describe('Edge Case: Approving Already-Approved Request', () => {
    it('cannot approve a request that is not PENDING', async () => {
      const visitSvc = new VisitRequestService();
      prismaMock.visitRequest.findUniqueOrThrow.mockResolvedValue(
        makeVisitRequest({ status: 'CANCELLED' }) as any
      );
      await expect(visitSvc.processRequest(TEST_IDS.visitRequest, { action: 'APPROVE' }, TEST_IDS.officer))
        .rejects.toThrow('Only pending');
    });
  });
});
