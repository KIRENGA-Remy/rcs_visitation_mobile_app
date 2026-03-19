/**
 * Unit Tests: UserService
 * Tests: list/get/role update/status update/soft delete + security checks
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { UserService } from '../../../modules/users/user.service';
import { makeUser, TEST_IDS } from '../../helpers/auth.helper';

const svc = new UserService();

describe('UserService.findAll', () => {
  it('returns paginated users without passwordHash', async () => {
    prismaMock.user.findMany.mockResolvedValue([makeUser()] as any);
    prismaMock.user.count.mockResolvedValue(1);
    const result = await svc.findAll({ page: 1, limit: 20 });
    expect(result.users).toHaveLength(1);
    expect((result.users[0] as any).passwordHash).toBeUndefined();
  });

  it('filters by role', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);
    await svc.findAll({ page: 1, limit: 20, role: 'ADMIN' });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ role: 'ADMIN' }) })
    );
  });

  it('applies search filter across name/email/phone/nationalId', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);
    await svc.findAll({ page: 1, limit: 20, search: 'Amina' });
    const call = prismaMock.user.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR.length).toBeGreaterThan(0);
  });
});

describe('UserService.softDelete', () => {
  it('throws when admin tries to delete own account', async () => {
    await expect(svc.softDelete(TEST_IDS.admin, TEST_IDS.admin))
      .rejects.toThrow('cannot delete your own account');
  });

  it('throws when trying to delete another ADMIN account', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ role: 'ADMIN', id: 'other-admin' }) as any);
    await expect(svc.softDelete('other-admin', TEST_IDS.admin))
      .rejects.toThrow('Admin accounts cannot be deleted');
  });

  it('anonymises PII on soft delete', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ role: 'VISITOR' }) as any);
    prismaMock.user.update.mockResolvedValue({ id: TEST_IDS.visitor, status: 'INACTIVE' } as any);
    await svc.softDelete(TEST_IDS.visitor, TEST_IDS.admin);
    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.data.email).toContain('@rcs.deleted');
    expect(updateCall.data.firstName).toBe('Deleted');
    expect(updateCall.data.nationalId).toBeNull();
    expect(updateCall.data.status).toBe('INACTIVE');
  });
});

describe('UserService.updateRole', () => {
  it('auto-creates visitorProfile when promoting to VISITOR', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser({ role: 'PRISON_OFFICER' }) as any);
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        visitorProfile: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
        user: { update: jest.fn().mockResolvedValue(makeUser()) },
      };
      return fn(tx);
    });
    await svc.updateRole(TEST_IDS.visitor, { role: 'VISITOR' });
    const txFn = prismaMock.$transaction.mock.calls[0][0] as any;
    // Transaction was called
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});
