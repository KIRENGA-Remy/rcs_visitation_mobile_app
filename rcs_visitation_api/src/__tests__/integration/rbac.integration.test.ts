/**
 * Integration Tests: Role-Based Access Control
 * Verifies that every protected route correctly enforces role restrictions.
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';
process.env.RATE_LIMIT_MAX     = '1000';
process.env.NODE_ENV           = 'test';

import { prismaMock } from '../helpers/prisma.mock';
jest.mock('../../config/prisma', () => ({ prisma: prismaMock }));

import request from 'supertest';
import app from '../../app';
import { VISITOR_TOKEN, OFFICER_TOKEN, ADMIN_TOKEN } from '../helpers/auth.helper';

const get  = (path: string, token: string) => request(app).get(path).set('Authorization', `Bearer ${token}`);
const post = (path: string, token: string, body = {}) => request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
const put  = (path: string, token: string, body = {}) => request(app).put(path).set('Authorization', `Bearer ${token}`).send(body);
const del  = (path: string, token: string) => request(app).delete(path).set('Authorization', `Bearer ${token}`);

describe('RBAC: Admin-only endpoints', () => {
  const adminOnlyEndpoints = [
    { method: 'get',  path: '/api/v1/users' },
    { method: 'get',  path: '/api/v1/settings/global' },
  ];

  for (const ep of adminOnlyEndpoints) {
    it(`VISITOR cannot access ${ep.method.toUpperCase()} ${ep.path}`, async () => {
      const res = ep.method === 'get' ? await get(ep.path, VISITOR_TOKEN) : await post(ep.path, VISITOR_TOKEN);
      expect(res.status).toBe(403);
    });

    it(`PRISON_OFFICER cannot access ${ep.method.toUpperCase()} ${ep.path}`, async () => {
      const res = ep.method === 'get' ? await get(ep.path, OFFICER_TOKEN) : await post(ep.path, OFFICER_TOKEN);
      expect(res.status).toBe(403);
    });
  }
});

describe('RBAC: Officer/Admin endpoints', () => {
  it('VISITOR cannot process visit requests (approve/reject)', async () => {
    const res = await request(app)
      .patch('/api/v1/visit-requests/some-id/process')
      .set('Authorization', `Bearer ${VISITOR_TOKEN}`)
      .send({ action: 'APPROVE' });
    expect(res.status).toBe(403);
  });

  it('VISITOR cannot check-in visitors', async () => {
    const res = await post('/api/v1/visit-logs/check-in', VISITOR_TOKEN, {
      visitRequestId: 'some-id', actualAdultsPresent: 1,
    });
    expect(res.status).toBe(403);
  });

  it('VISITOR cannot scan QR codes', async () => {
    const res = await post('/api/v1/verification/scan', VISITOR_TOKEN, { qrCode: 'ABC' });
    expect(res.status).toBe(403);
  });

  it('VISITOR cannot access reports', async () => {
    const res = await get('/api/v1/reports/overview', VISITOR_TOKEN);
    expect(res.status).toBe(403);
  });

  it('OFFICER can access reports', async () => {
    prismaMock.prisoner.count.mockResolvedValue(10);
    prismaMock.visitRequest.count.mockResolvedValue(50);
    prismaMock.visitLog.count.mockResolvedValue(30);
    prismaMock.user.count.mockResolvedValue(100);
    prismaMock.prison.count.mockResolvedValue(3);

    const res = await get('/api/v1/reports/overview', OFFICER_TOKEN);
    expect(res.status).toBe(200);
  });
});

describe('RBAC: Visitor-only endpoints', () => {
  it('VISITOR can access own visit requests', async () => {
    prismaMock.visitorProfile.findUnique.mockResolvedValue(null);
    const res = await get('/api/v1/visit-requests/my', VISITOR_TOKEN);
    expect([200, 404]).toContain(res.status); // 200 or 404 but NOT 403
    expect(res.status).not.toBe(403);
  });
});

describe('RBAC: No token', () => {
  it('returns 401 for any protected endpoint without token', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});
