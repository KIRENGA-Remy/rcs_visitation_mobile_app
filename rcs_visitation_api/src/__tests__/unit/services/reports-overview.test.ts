process.env.DATABASE_URL         = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET           = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS        = '1';
process.env.NODE_ENV             = 'test';
process.env.ADMIN_PASSWORD       = 'irrelevant1A';
process.env.OFFICER_PASSWORD     = 'irrelevant1A';
process.env.VISITOR_PASSWORD     = 'irrelevant1A';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { reportsService } from '../../../modules/reports/reports.service';

describe('ReportsService.overview — real numbers actually flow through', () => {
  it('returns the exact counts each mocked query resolves to, not zeros', async () => {
    // Deliberately distinct, non-zero, non-matching numbers for every
    // count so a bug that mixes up which count goes where — or silently
    // drops one — would be caught, not just "did it return an object".
    prismaMock.prisoner.count
      .mockResolvedValueOnce(41)  // total
      .mockResolvedValueOnce(37); // active
    prismaMock.visitRequest.count
      .mockResolvedValueOnce(19)  // total requests
      .mockResolvedValueOnce(7)   // pending
      .mockResolvedValueOnce(3);  // approvedToday
    prismaMock.visitLog.count
      .mockResolvedValueOnce(5)   // todayCheckins
      .mockResolvedValueOnce(2);  // flaggedIncidents
    prismaMock.user.count
      .mockResolvedValueOnce(50)  // total users
      .mockResolvedValueOnce(30); // visitors
    prismaMock.prison.count.mockResolvedValueOnce(4);
    prismaMock.approvedVisitorPrisoner.count.mockResolvedValueOnce(6); // pendingContactRequests

    const result = await reportsService.overview({});

    expect(result).toEqual({
      prisons:       { total: 4 },
      prisoners:     { total: 41, active: 37 },
      visitRequests: { total: 19, pending: 7, approvedToday: 3 },
      todayCheckins: 5,
      flaggedIncidents: 2,
      pendingContactRequests: 6,
      users: { total: 50, visitors: 30 },
    });

    // The specific field the screenshot showed stuck at zero — assert it
    // explicitly rather than just trusting the object-equality check above.
    expect(result.visitRequests.pending).toBe(7);
    expect(result.pendingContactRequests).toBe(6);
    expect(result.flaggedIncidents).toBe(2);
  });

  it('genuinely returns zero when every underlying count is actually zero (not a false negative)', async () => {
    prismaMock.prisoner.count.mockResolvedValue(0);
    prismaMock.visitRequest.count.mockResolvedValue(0);
    prismaMock.visitLog.count.mockResolvedValue(0);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.prison.count.mockResolvedValue(0);
    prismaMock.approvedVisitorPrisoner.count.mockResolvedValue(0);

    const result = await reportsService.overview({});
    expect(result.visitRequests.pending).toBe(0);
  });
});
