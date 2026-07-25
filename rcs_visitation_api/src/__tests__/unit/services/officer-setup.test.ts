process.env.DATABASE_URL         = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET           = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS        = '1';
process.env.NODE_ENV             = 'test';
process.env.ADMIN_PASSWORD       = 'irrelevant1A';
process.env.OFFICER_PASSWORD     = 'irrelevant1A';
process.env.VISITOR_PASSWORD     = 'irrelevant1A';
// Deliberately NOT setting EMAIL_USER/EMAIL_APP_PASSWORD — this test
// verifies the OTP hashing/verification logic works even when email
// sending itself fails, which is exactly the fallback path createOfficer
// is designed to handle (returns the raw OTP to the admin instead).

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { userService } from '../../../modules/users/user.service';

describe('UserService — officer OTP setup flow', () => {
  const officer = {
    id: 'officer-1', email: 'officer@example.com', phone: '+250788000000',
    firstName: 'Jean', lastName: 'Officer', role: 'PRISON_OFFICER', status: 'ACTIVE',
    passwordHash: 'placeholder-hash',
  };

  it('creates an officer and falls back to returning the raw OTP when email is not configured', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null); // no existing email/phone conflict
    prismaMock.user.create.mockResolvedValue(officer as any);
    prismaMock.passwordReset.create.mockResolvedValue({} as any);

    const result = await userService.createOfficer({
      email: officer.email, phone: officer.phone,
      firstName: officer.firstName, lastName: officer.lastName,
    } as any);

    expect(result.emailSent).toBe(false);
    expect(result.setupOtp).toBeDefined();
    expect(result.setupOtp).toMatch(/^\d{6}$/); // exactly 6 digits
    expect(prismaMock.passwordReset.create).toHaveBeenCalledTimes(1);
  });

  it('completeSetup succeeds when the OTP matches the stored hash and is not expired', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(officer as any);
    let storedHash = '';
    prismaMock.passwordReset.create.mockImplementation(((args: any) => {
      storedHash = args.data.token;
      return Promise.resolve({ id: 'reset-1', ...args.data });
    }) as any);

    const created = await userService.createOfficer({
      email: officer.email, phone: officer.phone,
      firstName: officer.firstName, lastName: officer.lastName,
    } as any);
    const realOtp = created.setupOtp!;

    prismaMock.user.findUnique.mockResolvedValue(officer as any);
    prismaMock.passwordReset.findFirst.mockResolvedValue({
      id: 'reset-1', userId: officer.id, token: storedHash,
      usedAt: null, expiresAt: new Date(Date.now() + 10 * 60 * 1000), createdAt: new Date(),
    } as any);
    prismaMock.$transaction.mockResolvedValue([{}, {}] as any);

    const result = await userService.completeSetup({
      email: officer.email, otp: realOtp, newPassword: 'NewPassw0rd',
    });

    expect(result.success).toBe(true);
  });

  it('completeSetup rejects an incorrect OTP', async () => {
    prismaMock.user.findUnique.mockResolvedValue(officer as any);
    const { hashPassword } = require('../../../shared/utils/bcrypt');
    const wrongHash = await hashPassword('999999');
    prismaMock.passwordReset.findFirst.mockResolvedValue({
      id: 'reset-1', userId: officer.id, token: wrongHash,
      usedAt: null, expiresAt: new Date(Date.now() + 10 * 60 * 1000), createdAt: new Date(),
    } as any);

    await expect(
      userService.completeSetup({ email: officer.email, otp: '111111', newPassword: 'NewPassw0rd' })
    ).rejects.toThrow(/Invalid or expired/);
  });

  it('completeSetup rejects when no pending (unused, unexpired) code exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(officer as any);
    prismaMock.passwordReset.findFirst.mockResolvedValue(null);

    await expect(
      userService.completeSetup({ email: officer.email, otp: '123456', newPassword: 'NewPassw0rd' })
    ).rejects.toThrow(/Invalid or expired/);
  });
});
