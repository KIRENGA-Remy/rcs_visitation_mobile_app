/**
 * Unit Tests: authorize middleware (RBAC)
 * Tests: correct role passes, wrong role blocked, unauthenticated blocked
 */
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.BCRYPT_ROUNDS      = '1';

import { Response, NextFunction } from 'express';
import { authorize } from '../../../middleware/authorize';
import { AuthRequest } from '../../../shared/types';

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res as Response;
};
const next: NextFunction = jest.fn();

const makeReq = (role?: string): AuthRequest =>
  ({ user: role ? { id: 'u1', role: role as any, email: 'x@y' } : undefined } as AuthRequest);

describe('authorize middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() when user has the required role', () => {
    const res = mockRes();
    authorize('ADMIN')(makeReq('ADMIN'), res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user has one of multiple allowed roles', () => {
    const res = mockRes();
    authorize('ADMIN', 'PRISON_OFFICER')(makeReq('PRISON_OFFICER'), res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user has wrong role', () => {
    const res = mockRes();
    authorize('ADMIN')(makeReq('VISITOR'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is undefined (unauthenticated)', () => {
    const res = mockRes();
    authorize('ADMIN')(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('VISITOR cannot access ADMIN-only routes', () => {
    const res = mockRes();
    authorize('ADMIN')(makeReq('VISITOR'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('VISITOR cannot access PRISON_OFFICER routes', () => {
    const res = mockRes();
    authorize('PRISON_OFFICER')(makeReq('VISITOR'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('PRISON_OFFICER cannot access ADMIN-only routes', () => {
    const res = mockRes();
    authorize('ADMIN')(makeReq('PRISON_OFFICER'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
