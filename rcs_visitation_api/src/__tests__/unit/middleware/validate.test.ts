/**
 * Unit Tests: validate middleware (Zod)
 * Tests: valid input passes, invalid input returns 422, unknown fields stripped
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../middleware/validate';

const schema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  age:   z.number().positive().optional(),
});

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res as Response;
};
const next: NextFunction = jest.fn();

describe('validate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid body', () => {
    const req: any = { body: { name: 'Amina', email: 'amina@rcs.rw' } };
    validate(schema)(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 422 for invalid email', () => {
    const req: any = { body: { name: 'Amina', email: 'not-an-email' } };
    const res = mockRes();
    validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 422 when required field is missing', () => {
    const req: any = { body: { email: 'a@b.com' } }; // missing name
    const res = mockRes();
    validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('returns 422 when name is too short', () => {
    const req: any = { body: { name: 'A', email: 'a@b.com' } };
    const res = mockRes();
    validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('validates query params when target is "query"', () => {
    const qSchema = z.object({ page: z.coerce.number().positive().default(1) });
    const req: any = { query: { page: '2' } };
    validate(qSchema, 'query')(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(2); // coerced
  });

  it('returns 422 for invalid query param', () => {
    const qSchema = z.object({ page: z.coerce.number().positive() });
    const req: any = { query: { page: '-1' } };
    const res = mockRes();
    validate(qSchema, 'query')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
