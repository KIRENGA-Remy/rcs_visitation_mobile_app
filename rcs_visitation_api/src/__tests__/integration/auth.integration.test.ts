/**
 * Integration Tests: Auth Routes via Supertest
 * Tests HTTP layer: correct status codes, response shape, headers, rate limiting
 * Prisma is mocked so no real DB is needed.
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';
process.env.RATE_LIMIT_MAX     = '100';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.NODE_ENV           = 'test';

import { prismaMock } from '../helpers/prisma.mock';
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import app from '../../app';
import { makeUser, VISITOR_TOKEN } from '../helpers/auth.helper';
import bcrypt from 'bcryptjs';

describe('POST /api/v1/auth/register', () => {
  const VALID_BODY = {
    email: 'test@rcs.rw', phone: '+250788001001',
    password: 'Password@123', firstName: 'Test', lastName: 'User',
  };

  it('returns 201 with tokens on valid registration', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(makeUser() as any);

    const res = await request(app).post('/api/v1/auth/register').send(VALID_BODY);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ ...VALID_BODY, email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for weak password (no uppercase)', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ ...VALID_BODY, password: 'weakpassword1' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(422);
  });

  it('returns 409 when email/phone already registered', async () => {
    prismaMock.user.findFirst.mockResolvedValue(makeUser() as any);
    const res = await request(app).post('/api/v1/auth/register').send(VALID_BODY);
    expect(res.status).toBe(409);
  });

  it('response does not contain passwordHash', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(makeUser() as any);
    const res = await request(app).post('/api/v1/auth/register').send(VALID_BODY);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    const hash = await bcrypt.hash('Password@123', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);
    prismaMock.user.update.mockResolvedValue(makeUser() as any);

    const res = await request(app).post('/api/v1/auth/login')
      .send({ emailOrPhone: 'visitor@test.rw', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('CorrectPass@1', 1);
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ passwordHash: hash }) as any);

    const res = await request(app).post('/api/v1/auth/login')
      .send({ emailOrPhone: 'visitor@test.rw', password: 'WrongPass@1' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for suspended account', async () => {
    prismaMock.user.findFirst.mockResolvedValue(makeUser({ status: 'SUSPENDED' }) as any);

    const res = await request(app).post('/api/v1/auth/login')
      .send({ emailOrPhone: 'visitor@test.rw', password: 'Password@123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('suspended');
  });

  it('returns 401 for unknown user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const res = await request(app).post('/api/v1/auth/login')
      .send({ emailOrPhone: 'ghost@rcs.rw', password: 'Password@123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without auth header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token');
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(makeUser() as any);
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${VISITOR_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
