process.env.DATABASE_URL         = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET           = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS        = '1';
process.env.RATE_LIMIT_MAX       = '100';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.NODE_ENV             = 'test';

import { prismaMock } from '../helpers/prisma.mock';
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import app from '../../app';
import { makeUser, TEST_IDS } from '../helpers/auth.helper';
import { signRefreshToken } from '../../shared/utils/jwt';

describe('POST /api/v1/auth/refresh', () => {
  it('returns a new access token and rotated refresh token for a valid refresh token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser() as any);

    const validRefreshToken = signRefreshToken(TEST_IDS.visitor);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Rotation: the refresh token returned should differ from the one sent in
    expect(res.body.data.refreshToken).not.toBe(validRefreshToken);
  });

  it('returns 401 for a malformed/invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when the refresh token is valid but the user no longer exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const orphanedRefreshToken = signRefreshToken('deleted-user-id');

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: orphanedRefreshToken });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user account is suspended', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ status: 'SUSPENDED' }) as any);

    const suspendedUserRefreshToken = signRefreshToken(TEST_IDS.visitor);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: suspendedUserRefreshToken });

    expect(res.status).toBe(401);
  });

  it('returns 422 when refreshToken is missing from the request body', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(422);
  });
});
