process.env.DATABASE_URL         = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET           = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS        = '1';
process.env.NODE_ENV             = 'test';
process.env.ADMIN_PASSWORD       = 'irrelevant1A';
process.env.OFFICER_PASSWORD     = 'irrelevant1A';
process.env.VISITOR_PASSWORD     = 'irrelevant1A';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { userService } from '../../../modules/users/user.service';

describe('UserService — admin protections and createAdmin', () => {
  it('blocks an admin from changing their own status', async () => {
    await expect(
      userService.updateStatus('admin-1', { status: 'SUSPENDED' } as any, 'admin-1')
    ).rejects.toThrow(/cannot suspend or deactivate your own/);
  });

  it('blocks an admin from changing another admin\'s status', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ id: 'admin-2', role: 'ADMIN' } as any);

    await expect(
      userService.updateStatus('admin-2', { status: 'SUSPENDED' } as any, 'admin-1')
    ).rejects.toThrow(/cannot be suspended or deactivated/);
  });

  it('allows an admin to suspend an officer', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ id: 'officer-1', role: 'PRISON_OFFICER' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'officer-1', status: 'SUSPENDED' } as any);

    const result = await userService.updateStatus('officer-1', { status: 'SUSPENDED' } as any, 'admin-1');
    expect(result.status).toBe('SUSPENDED');
  });

  it('allows an admin to suspend a visitor', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ id: 'visitor-1', role: 'VISITOR' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'visitor-1', status: 'SUSPENDED' } as any);

    const result = await userService.updateStatus('visitor-1', { status: 'SUSPENDED' } as any, 'admin-1');
    expect(result.status).toBe('SUSPENDED');
  });

  it('createAdmin creates a user with role ADMIN, not PRISON_OFFICER', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(((args: any) => Promise.resolve({ id: 'new-admin', ...args.data })) as any);
    prismaMock.passwordReset.create.mockResolvedValue({} as any);

    const result = await userService.createAdmin({
      email: 'newadmin@example.com', phone: '+250788111111',
      firstName: 'Alice', lastName: 'Admin',
    } as any);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'ADMIN' }) })
    );
    expect(result.setupOtp).toMatch(/^\d{6}$/); // email not configured in test env -> fallback OTP returned
  });

  it('createAdmin rejects a duplicate email/phone', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      userService.createAdmin({
        email: 'dupe@example.com', phone: '+250788222222',
        firstName: 'Bob', lastName: 'Admin',
      } as any)
    ).rejects.toThrow(/already registered/);
  });
});
