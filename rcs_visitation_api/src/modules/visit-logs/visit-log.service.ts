import { prisma } from '../../config/prisma';
import { CheckInDto, CheckOutDto } from './visit-log.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';

export class VisitLogService {

  async checkIn(dto: CheckInDto, officerUserId: string) {
    const request = await prisma.visitRequest.findUniqueOrThrow({
      where: { id: dto.visitRequestId },
      include: { visitLog: true, prisoner: true },
    });

    if (request.status !== 'APPROVED') throw new Error('Only approved requests can be checked in');
    if (request.visitLog) throw new Error('Visitor is already checked in');

    // Verify QR code is still valid
    if (request.qrCodeExpiresAt && request.qrCodeExpiresAt < new Date()) {
      throw new Error('QR code has expired');
    }

    return prisma.$transaction(async (tx) => {
      // Create the log
      const log = await tx.visitLog.create({
        data: {
          visitRequestId:       dto.visitRequestId,
          conductedByUserId:    officerUserId,
          actualCheckinTime:    new Date(),
          actualAdultsPresent:  dto.actualAdultsPresent,
          actualChildrenPresent:dto.actualChildrenPresent,
          itemsCarriedIn:       dto.itemsCarriedIn,
          officerNotes:         dto.officerNotes,
        },
      });
      // Update request status
      await tx.visitRequest.update({
        where: { id: dto.visitRequestId },
        data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      });
      // Increment prisoner visit count
      await tx.prisoner.update({
        where: { id: request.prisonerId },
        data: { totalVisitsReceived: { increment: 1 } },
      });
      return log;
    });
  }

  async checkOut(visitLogId: string, dto: CheckOutDto, officerUserId: string) {
    const log = await prisma.visitLog.findUniqueOrThrow({
      where: { id: visitLogId },
      include: {
        visitRequest: {
          include: {
            visitorProfile: { select: { userId: true } },
            prisoner:        { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (log.actualCheckoutTime) throw new Error('Visit is already checked out');
    if (log.visitRequest.status !== 'CHECKED_IN') throw new Error('Visitor is not currently checked in');

    const checkoutTime = new Date();
    const durationMins = Math.round((checkoutTime.getTime() - log.actualCheckinTime.getTime()) / 60000);
    const isFlagged    = dto.incidentType !== 'NONE';

    const result = await prisma.$transaction(async (tx) => {
      // Update log
      const updated = await tx.visitLog.update({
        where: { id: visitLogId },
        data: {
          actualCheckoutTime:  checkoutTime,
          durationMinutes:     durationMins,
          incidentType:        dto.incidentType,
          incidentNotes:       dto.incidentNotes,
          itemsConfiscated:    dto.itemsConfiscated,
          officerNotes:        dto.officerNotes ?? log.officerNotes,
          visitQuality:        dto.visitQuality,
          incidentFlagged:     isFlagged,
          flaggedAt:           isFlagged ? checkoutTime : null,
        },
      });
      // Complete the request
      await tx.visitRequest.update({
        where: { id: log.visitRequestId },
        data: {
          status:           'COMPLETED',
          checkedOutAt:     checkoutTime,
          actualDurationMins: durationMins,
        },
      });
      // Update visitor total visit count
      await tx.visitorProfile.update({
        where: { id: log.visitRequest.visitorProfileId },
        data: { totalVisitsCount: { increment: 1 }, lastVisitAt: checkoutTime },
      });
      return updated;
    });

    // Same gap as visit-request approval: check-out previously updated the
    // database but never told the visitor their visit was recorded complete.
    try {
      await notificationService.send({
        userId: log.visitRequest.visitorProfile.userId,
        type:   'VISIT_COMPLETED',
        title:  'Visit Completed',
        body:   `Your visit to ${log.visitRequest.prisoner.firstName} ${log.visitRequest.prisoner.lastName} has been logged as complete. Thank you.`,
        visitRequestId: log.visitRequestId,
      });
    } catch {
      // Non-fatal — the check-out itself already succeeded.
    }

    return result;
  }

  async getById(id: string) {
    return prisma.visitLog.findUniqueOrThrow({
      where: { id },
      include: {
        visitRequest: {
          include: {
            visitorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
            prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
            schedule: { select: { startTime: true, endTime: true } },
          },
        },
        conductedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(query: { prisonId?: string; date?: string; flagged?: string; page?: unknown; limit?: unknown }, requestorId: string, requestorRole: string) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.flagged === 'true') where.incidentFlagged = true;
    if (query.date) {
      const d = new Date(query.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.actualCheckinTime = { gte: d, lt: next };
    }
    // Same scoping as visit-requests — an officer should only see activity
    // for the prison they're actually assigned to, not every check-in/out
    // across every facility in the system.
    if (requestorRole === 'PRISON_OFFICER') {
      const officer = await prisma.user.findUnique({ where: { id: requestorId }, select: { assignedPrisonId: true } });
      if (officer?.assignedPrisonId) {
        where.visitRequest = { schedule: { prisonId: officer.assignedPrisonId } };
      }
    }
    const [logs, total] = await Promise.all([
      prisma.visitLog.findMany({
        where, skip, take: limit,
        include: {
          visitRequest: {
            include: {
              visitorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
              prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
              schedule: { include: { prison: { select: { name: true, code: true } } } },
            },
          },
          conductedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { actualCheckinTime: 'desc' },
      }),
      prisma.visitLog.count({ where }),
    ]);
    return { logs, pagination: buildPagination(page, limit, total) };
  }
}

export const visitLogService = new VisitLogService();
