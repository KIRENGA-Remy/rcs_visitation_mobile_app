import { prisma } from '../../config/prisma';

export class ReportsService {

  // Daily visits report — how many check-ins happened per day
  async dailyVisits(query: { prisonId?: string; from?: string; to?: string }) {
    const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate   = query.to   ? new Date(query.to)   : new Date();

    const where: any = {
      actualCheckinTime: { gte: fromDate, lte: toDate },
    };

    if (query.prisonId) {
      where.visitRequest = { schedule: { prisonId: query.prisonId } };
    }

    // Raw group-by day
    const logs = await prisma.visitLog.findMany({
      where,
      select: {
        actualCheckinTime: true,
        durationMinutes:   true,
        incidentFlagged:   true,
        visitRequest: {
          select: {
            status:  true,
            numberOfAdults: true,
            numberOfChildren: true,
          },
        },
      },
      orderBy: { actualCheckinTime: 'asc' },
    });

    // Group by date in application layer (avoids raw SQL)
    const byDay: Record<string, { date: string; totalVisits: number; totalVisitors: number; incidents: number; avgDurationMins: number; durations: number[] }> = {};
    for (const log of logs) {
      const day = log.actualCheckinTime.toISOString().substring(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, totalVisits: 0, totalVisitors: 0, incidents: 0, avgDurationMins: 0, durations: [] };
      byDay[day].totalVisits++;
      byDay[day].totalVisitors += log.visitRequest.numberOfAdults + log.visitRequest.numberOfChildren;
      if (log.incidentFlagged) byDay[day].incidents++;
      if (log.durationMinutes) byDay[day].durations.push(log.durationMinutes);
    }

    return Object.values(byDay).map(d => ({
      date:            d.date,
      totalVisits:     d.totalVisits,
      totalVisitors:   d.totalVisitors,
      incidents:       d.incidents,
      avgDurationMins: d.durations.length > 0
        ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length)
        : 0,
    }));
  }

  // Peak hours — which hours of the day have the most check-ins
  async peakHours(query: { prisonId?: string; from?: string; to?: string }) {
    const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate   = query.to   ? new Date(query.to)   : new Date();

    const where: any = { actualCheckinTime: { gte: fromDate, lte: toDate } };
    if (query.prisonId) {
      where.visitRequest = { schedule: { prisonId: query.prisonId } };
    }

    const logs = await prisma.visitLog.findMany({
      where,
      select: { actualCheckinTime: true },
    });

    const byHour: Record<number, number> = {};
    for (const log of logs) {
      const hour = log.actualCheckinTime.getHours();
      byHour[hour] = (byHour[hour] ?? 0) + 1;
    }

    return Array.from({ length: 24 }, (_, h) => ({
      hour:       h,
      label:      `${String(h).padStart(2, '0')}:00`,
      visitCount: byHour[h] ?? 0,
    })).sort((a, b) => b.visitCount - a.visitCount);
  }

  // Prisoner activity — most / least visited prisoners
  async prisonerActivity(query: { prisonId?: string; limit?: string; from?: string; to?: string }) {
    const limit   = Math.min(100, parseInt(query.limit ?? '20', 10));
    const fromDate= query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate  = query.to   ? new Date(query.to)   : new Date();

    const where: any = {
      status: { in: ['COMPLETED', 'CHECKED_IN'] },
      schedule: { startTime: { gte: fromDate, lte: toDate } },
    };
    if (query.prisonId) where.schedule = { ...where.schedule, prisonId: query.prisonId };

    const requests = await prisma.visitRequest.findMany({
      where,
      select: {
        prisonerId: true,
        prisoner:   { select: { firstName: true, lastName: true, prisonerNumber: true, prison: { select: { name: true, code: true } } } },
      },
    });

    const byPrisoner: Record<string, any> = {};
    for (const r of requests) {
      const key = r.prisonerId;
      if (!byPrisoner[key]) byPrisoner[key] = { prisonerId: key, prisoner: r.prisoner, visitCount: 0 };
      byPrisoner[key].visitCount++;
    }

    return Object.values(byPrisoner)
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  // Platform-wide overview — single stats object for admin dashboard
  async overview(query: { prisonId?: string }) {
    const prisonFilter = query.prisonId ? { prisonId: query.prisonId } : {};
    const reqFilter    = query.prisonId ? { schedule: { prisonId: query.prisonId } } : {};

    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPrisoners, activePrisoners,
      totalVisitRequests, pendingRequests, approvedToday,
      todayCheckins, flaggedIncidents,
      totalUsers, totalVisitors,
      totalPrisons,
    ] = await Promise.all([
      prisma.prisoner.count({ where: prisonFilter }),
      prisma.prisoner.count({ where: { ...prisonFilter, status: 'ACTIVE' } }),
      prisma.visitRequest.count({ where: reqFilter }),
      prisma.visitRequest.count({ where: { ...reqFilter, status: 'PENDING' } }),
      prisma.visitRequest.count({ where: { ...reqFilter, status: 'APPROVED', createdAt: { gte: today, lt: tomorrow } } }),
      prisma.visitLog.count({ where: { actualCheckinTime: { gte: today, lt: tomorrow }, ...(query.prisonId ? { visitRequest: { schedule: { prisonId: query.prisonId } } } : {}) } }),
      prisma.visitLog.count({ where: { incidentFlagged: true, ...(query.prisonId ? { visitRequest: { schedule: { prisonId: query.prisonId } } } : {}) } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VISITOR' } }),
      prisma.prison.count({ where: { isActive: true } }),
    ]);

    return {
      prisons:          { total: totalPrisons },
      prisoners:        { total: totalPrisoners, active: activePrisoners },
      visitRequests:    { total: totalVisitRequests, pending: pendingRequests, approvedToday },
      todayCheckins,
      flaggedIncidents,
      users:            { total: totalUsers, visitors: totalVisitors },
    };
  }
}

export const reportsService = new ReportsService();
