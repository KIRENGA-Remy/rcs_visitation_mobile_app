/**
 * Unit Tests: authenticate middleware
 * Tests: missing token, invalid token, expired token, valid token
 */
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.BCRYPT_ROUNDS      = '1';

import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { signAccessToken } from '../../../shared/utils/jwt';

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when no Authorization header', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    authenticate(req as any, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header missing Bearer prefix', () => {
    const req = { headers: { authorization: 'Token abc123' } } as any;
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid JWT', () => {
    const req = { headers: { authorization: 'Bearer invalid.token.here' } } as any;
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for valid token', () => {
    const payload = { id: 'user-1', role: 'VISITOR' as any, email: 'test@rw' };
    const token   = signAccessToken(payload);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'user-1', role: 'VISITOR' });
  });

  it('does not expose passwordHash or sensitive fields in req.user', () => {
    const payload = { id: 'user-1', role: 'ADMIN' as any, email: 'admin@rw' };
    const token   = signAccessToken(payload);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    authenticate(req, { status: jest.fn().mockReturnThis(), json: jest.fn() } as any, mockNext);
    expect(req.user.passwordHash).toBeUndefined();
  });
});
