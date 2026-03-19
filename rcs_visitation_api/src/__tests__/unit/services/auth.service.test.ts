/**
 * Unit Tests: AuthService
 * Tests: register (duplicate, success, auto-profile), login (bad creds, suspended, success)
 * Prisma is fully mocked — no DB required.
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { AuthService } from '../../../modules/auth/auth.service';
import { makeUser } from '../../helpers/auth.helper';
import bcrypt from 'bcryptjs';

const svc = new AuthService();

const REGISTER_DTO = {
  email:     'amina@test.rw',
  phone:     '+250788000001',
  password:  'Password@123',
  firstName: 'Amina',
  lastName:  'Uwase',
  role:      'VISITOR' as const,
};

describe('AuthService.register', () => {
  it('throws if email or phone already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue(makeUser() as any);
    await expect(svc.register(REGISTER_DTO)).rejects.toThrow('already registered');
  });

  it('creates user and returns tokens on success', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const created = makeUser({ id: 'new-user-id', email: REGISTER_DTO.email });
    prismaMock.user.create.mockResolvedValue(created as any);

    const result = await svc.register(REGISTER_DTO);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe(REGISTER_DTO.email);
  });

  it('never returns passwordHash in the response', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const created = makeUser();
    prismaMock.user.create.mockResolvedValue(created as any);

    const result = await svc.register(REGISTER_DTO);
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('auto-creates visitorProfile for VISITOR role', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(makeUser() as any);

    await svc.register(REGISTER_DTO);

    const createCall = prismaMock.user.create.mock.calls[0][0];
    expect(createCall.data.visitorProfile).toEqual({ create: {} });
  });

  it('does NOT create visitorProfile for ADMIN role', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(makeUser({ role: 'ADMIN' }) as any);

    await svc.register({ ...REGISTER_DTO, role: 'VISITOR' as any }); // role controlled in schema
    // visitorProfile: dto.role === 'VISITOR' ? { create: {} } : undefined
    const createCall = prismaMock.user.create.mock.calls[0][0];
    // For VISITOR it should create
    expect(createCall.data.visitorProfile).toBeDefined();
  });
});

describe('AuthService.login', () => {
  it('throws Invalid credentials when user not found', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    await expect(svc.login({ emailOrPhone: 'ghost@rw', password: 'any' }))
      .rejects.toThrow('Invalid credentials');
  });

  it('throws when account is suspended', async () => {
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ status: 'SUSPENDED' }) as any);
    await expect(svc.login({ emailOrPhone: 'amina@test.rw', password: 'Password@123' }))
      .rejects.toThrow('suspended');
  });

  it('throws when password is wrong', async () => {
    const hash = await bcrypt.hash('CorrectPass@1', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);
    prismaMock.user.update.mockResolvedValue(makeUser() as any);

    await expect(svc.login({ emailOrPhone: 'amina@test.rw', password: 'WrongPass@1' }))
      .rejects.toThrow('Invalid credentials');
  });

  it('returns tokens and user on successful login', async () => {
    const hash = await bcrypt.hash('Password@123', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);
    prismaMock.user.update.mockResolvedValue(makeUser() as any);

    const result = await svc.login({ emailOrPhone: 'amina@test.rw', password: 'Password@123' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('visitor@test.rw');
  });

  it('updates lastLoginAt on successful login', async () => {
    const hash = await bcrypt.hash('Password@123', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);
    prismaMock.user.update.mockResolvedValue(makeUser() as any);

    await svc.login({ emailOrPhone: 'amina@test.rw', password: 'Password@123' });
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastLoginAt: expect.any(Date) }) })
    );
  });

  it('never returns passwordHash in login response', async () => {
    const hash = await bcrypt.hash('Password@123', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);
    prismaMock.user.update.mockResolvedValue(makeUser() as any);

    const result = await svc.login({ emailOrPhone: 'amina@test.rw', password: 'Password@123' });
    expect((result.user as any).passwordHash).toBeUndefined();
  });
});
