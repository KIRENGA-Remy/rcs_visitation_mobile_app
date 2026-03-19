/**
 * Unit Tests: JWT Utilities
 * Tests: sign, verify, expiry, invalid tokens
 */
import jwt from 'jsonwebtoken';

// Override env before importing jwt utils
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32chars';
process.env.JWT_EXPIRES_IN     = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.BCRYPT_ROUNDS      = '1'; // fast for tests

import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../../shared/utils/jwt';

describe('JWT Utilities', () => {
  const payload = { id: 'user-123', role: 'VISITOR' as any, email: 'test@rw.test' };

  describe('signAccessToken', () => {
    it('returns a non-empty string', () => {
      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('encodes correct payload', () => {
      const token   = signAccessToken(payload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.email).toBe(payload.email);
    });

    it('contains expiry claim', () => {
      const token   = signAccessToken(payload);
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyAccessToken', () => {
    it('verifies a valid token', () => {
      const token   = signAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
    });

    it('throws on expired token', () => {
      const expired = jwt.sign(payload, 'test-jwt-secret-that-is-long-enough-32chars', { expiresIn: '-1s' });
      expect(() => verifyAccessToken(expired)).toThrow();
    });

    it('throws on token signed with wrong secret', () => {
      const wrongSecret = jwt.sign(payload, 'completely-wrong-secret-xxxxxxxxxxxxxx');
      expect(() => verifyAccessToken(wrongSecret)).toThrow();
    });
  });

  describe('signRefreshToken', () => {
    it('signs a refresh token with userId only', () => {
      const token   = signRefreshToken('user-123');
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe('user-123');
      // Should NOT contain email or role
      expect(decoded.email).toBeUndefined();
      expect(decoded.role).toBeUndefined();
    });
  });

  describe('verifyRefreshToken', () => {
    it('verifies valid refresh token', () => {
      const token   = signRefreshToken('user-123');
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe('user-123');
    });

    it('throws on invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
