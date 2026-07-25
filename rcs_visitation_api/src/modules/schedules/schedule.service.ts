import { prisma } from '../../config/prisma';
import { CreateScheduleDto, UpdateScheduleDto } from './schedule.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';

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

  async update(id: string, dto: UpdateScheduleDto) {
    const schedule = await prisma.visitSchedule.findUniqueOrThrow({ where: { id } });

    if (dto.maxCapacity !== undefined && dto.maxCapacity < schedule.currentBookings) {
      throw new Error(`Cannot reduce capacity below ${schedule.currentBookings} existing bookings`);
    }
    if (dto.endTime && dto.startTime && new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw new Error('End time must be after start time');
    }

    const timeChanged = !!(dto.startTime || dto.endTime);

    const updated = await prisma.visitSchedule.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime:   dto.endTime   ? new Date(dto.endTime)   : undefined,
      },
    });

    // Only bother notifying people if something they'd actually care about
    // changed — a note-only edit isn't worth an alert.
    if (timeChanged) {
      await this.notifyScheduleChange(
        updated,
        'Visit Schedule Updated',
        `The time for your visit slot${updated.label ? ` (${updated.label})` : ''} has changed. Please check the new details.`,
      );
    }

    return updated;
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

      // Previously this silently cancelled requests with no notification at
      // all — visitors and officers had no way of knowing why a visit
      // disappeared. Notify both, same as `update` does for time changes.
      await this.notifyScheduleChange(
        schedule,
        'Visit Schedule Cancelled',
        `A visit slot${schedule.label ? ` (${schedule.label})` : ''} has been cancelled. Any pending or approved visits in it were also cancelled.`,
      );

      return schedule;
    });
  }

  /**
   * Notifies every visitor with a live (PENDING/APPROVED) request against
   * this schedule, plus every officer assigned to the schedule's prison.
   * There's no dedicated NotificationType for schedule changes in the
   * current schema — reusing SYSTEM_ALERT rather than adding a new enum
   * value (would need its own migration) for now.
   */
  private async notifyScheduleChange(schedule: { id: string; prisonId: string }, title: string, body: string) {
    const [affectedRequests, assignedOfficers] = await Promise.all([
      prisma.visitRequest.findMany({
        where: { scheduleId: schedule.id, status: { in: ['PENDING', 'APPROVED'] } },
        include: { visitorProfile: { select: { userId: true } } },
      }),
      prisma.user.findMany({
        where: { role: 'PRISON_OFFICER', assignedPrisonId: schedule.prisonId },
        select: { id: true },
      }),
    ]);

    const visitorUserIds = affectedRequests.map((r) => r.visitorProfile.userId);
    const officerUserIds = assignedOfficers.map((o) => o.id);
    const allRecipients  = [...new Set([...visitorUserIds, ...officerUserIds])];

    await Promise.allSettled(
      allRecipients.map((userId) =>
        notificationService.send({ userId, type: 'SYSTEM_ALERT', title, body })
      )
    );
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
}

export const scheduleService = new ScheduleService();
