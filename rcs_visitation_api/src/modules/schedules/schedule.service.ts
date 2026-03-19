import { prisma } from '../../config/prisma';
import { CreateScheduleDto } from './schedule.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

export class ScheduleService {
  async create(dto: CreateScheduleDto, createdByUserId: string) {
    return prisma.visitSchedule.create({
      data: {
        ...dto,
        date:      new Date(dto.date),
        startTime: new Date(dto.startTime),
        endTime:   new Date(dto.endTime),
        createdByUserId,
      },
    });
  }

  async findAvailable(query: { prisonId?: string; date?: string; visitType?: string; page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = { status: 'OPEN' };
    if (query.prisonId)  where.prisonId  = query.prisonId;
    if (query.visitType) where.visitType = query.visitType;
    if (query.date) {
      const d = new Date(query.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.startTime = { gte: d, lt: next };
    } else {
      // Default: show future schedules only
      where.startTime = { gte: new Date() };
    }

    const [schedules, total] = await Promise.all([
      prisma.visitSchedule.findMany({
        where, skip, take: limit,
        include: { prison: { select: { name: true, code: true } } },
        orderBy: { startTime: 'asc' },
      }),
      prisma.visitSchedule.count({ where }),
    ]);

    // Add availableSlots derived field
    const enriched = schedules.map(s => ({
      ...s,
      availableSlots: s.maxCapacity - s.currentBookings,
    }));

    return { schedules: enriched, pagination: buildPagination(page, limit, total) };
  }

  async findById(id: string) {
    return prisma.visitSchedule.findUniqueOrThrow({
      where: { id },
      include: {
        prison: true,
        visitRequests: {
          where: { status: { in: ['APPROVED', 'CHECKED_IN'] } },
          select: { id: true, status: true },
        },
      },
    });
  }

  async cancel(id: string) {
    return prisma.$transaction(async (tx) => {
      // Cancel the schedule
      const schedule = await tx.visitSchedule.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      // Cancel all pending/approved requests for this slot
      await tx.visitRequest.updateMany({
        where: { scheduleId: id, status: { in: ['PENDING', 'APPROVED'] } },
        data: { status: 'CANCELLED', cancellationReason: 'Visit slot was cancelled by administration' },
      });
      return schedule;
    });
  }
}

export const scheduleService = new ScheduleService();
