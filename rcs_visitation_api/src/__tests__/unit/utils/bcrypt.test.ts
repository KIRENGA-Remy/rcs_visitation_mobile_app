/**
 * Unit Tests: bcrypt Utilities
 */
process.env.DATABASE_URL   = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET     = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS  = '1'; // fast in tests

import { hashPassword, comparePassword } from '../../../shared/utils/bcrypt';

describe('bcrypt Utilities', () => {
  const plain = 'Password@123';

  it('hashes a password into a bcrypt string', async () => {
    const hash = await hashPassword(plain);
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('produces different hashes for the same input (salt)', async () => {
    const h1 = await hashPassword(plain);
    const h2 = await hashPassword(plain);
    expect(h1).not.toBe(h2);
  });

  it('comparePassword returns true for correct password', async () => {
    const hash  = await hashPassword(plain);
    const match = await comparePassword(plain, hash);
    expect(match).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash  = await hashPassword(plain);
    const match = await comparePassword('WrongPass!1', hash);
    expect(match).toBe(false);
  });

  it('never returns plain text in hash', async () => {
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
  });
});
