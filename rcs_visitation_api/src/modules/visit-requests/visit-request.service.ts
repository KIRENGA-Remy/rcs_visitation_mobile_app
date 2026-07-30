import { prisma } from '../../config/prisma';
import { CreateVisitRequestDto, ProcessRequestDto, CancelRequestDto } from './visit-request.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';

export class VisitRequestService {

  /**
   * Same lazy-check pattern used for schedule expiry and overdue
   * checkouts — no cron scheduler exists in this backend, so this runs
   * whenever visit requests are actually listed. An APPROVED request
   * whose scheduled slot has ended without the visitor ever being checked
   * in matches the schema's own definition of EXPIRED exactly ("approved
   * but slot passed without check-in") — so that's the real status this
   * transitions to. Officer-facing screens label this "No Show" instead
   * of "Expired" for that specific audience (see PendingRequestsScreen.tsx
   * on mobile), but it's the same underlying status either way — there's
   * no need for two different state transitions to represent one event.
   */
  private async expireUncheckedApprovals() {
    await prisma.visitRequest.updateMany({
      where: {
        status: 'APPROVED',
        schedule: { endTime: { lt: new Date() } },
      },
      data: { status: 'EXPIRED' },
    });
  }

  async create(dto: CreateVisitRequestDto, visitorUserId: string) {
    // Get visitor profile
    const visitorProfile = await prisma.visitorProfile.findUnique({
      where: { userId: visitorUserId },
    });
    if (!visitorProfile) throw new Error('Visitor profile not found');
    if (visitorProfile.isBanned) throw new Error('You are currently banned from making visit requests');

    // Validate prisoner
    const prisoner = await prisma.prisoner.findUniqueOrThrow({ where: { id: dto.prisonerId } });
    if (prisoner.status !== 'ACTIVE') throw new Error('This prisoner is not currently accepting visits');
    if (prisoner.visitingRestricted) {
      const until = prisoner.restrictionUntil;
      if (!until || until > new Date()) throw new Error(`Visits are restricted for this prisoner: ${prisoner.restrictionReason}`);
    }

    // Validate schedule
    const schedule = await prisma.visitSchedule.findUniqueOrThrow({ where: { id: dto.scheduleId } });
    if (schedule.prisonId !== prisoner.prisonId) throw new Error('Schedule does not belong to the prisoner\'s prison');
    if (schedule.status !== 'OPEN') throw new Error('This time slot is not available for booking');
    if (schedule.currentBookings >= schedule.maxCapacity) throw new Error('This time slot is fully booked');
    if (new Date(schedule.endTime) < new Date()) throw new Error('Cannot book a past time slot');

    // Check for duplicate booking
    const existing = await prisma.visitRequest.findFirst({
      where: {
        visitorProfileId: visitorProfile.id,
        prisonerId:       dto.prisonerId,
        scheduleId:       dto.scheduleId,
        status:           { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing) throw new Error('You already have an active booking for this prisoner at this time');

    // Create request + increment schedule bookings in a transaction
    return prisma.$transaction(async (tx) => {
      const request = await tx.visitRequest.create({
        data: {
          visitorProfileId: visitorProfile.id,
          prisonerId:       dto.prisonerId,
          scheduleId:       dto.scheduleId,
          visitType:        dto.visitType,
          purposeNote:      dto.purposeNote,
          numberOfAdults:   dto.numberOfAdults,
          numberOfChildren: dto.numberOfChildren,
        },
        include: {
          prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
          schedule: { select: { startTime: true, endTime: true, label: true } },
        },
      });
      await tx.visitSchedule.update({
        where: { id: dto.scheduleId },
        data: {
          currentBookings: { increment: 1 },
          status: schedule.currentBookings + 1 >= schedule.maxCapacity ? 'FULL' : 'OPEN',
        },
      });
      return request;
    });
  }

  async processRequest(id: string, dto: ProcessRequestDto, officerUserId: string) {
    const request = await prisma.visitRequest.findUniqueOrThrow({ where: { id } });
    if (request.status !== 'PENDING') throw new Error('Only pending requests can be processed');

    const isApproved = dto.action === 'APPROVE';
    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status:              isApproved ? 'APPROVED' : 'REJECTED',
        rejectionReason:     isApproved ? null : dto.rejectionReason,
        processedByUserId:   officerUserId,
        processedAt:         new Date(),
        // Generate QR code token on approval
        qrCode:              isApproved ? `RCS-${Math.random().toString(36).substring(2, 15).toUpperCase()}` : null,
        qrCodeExpiresAt:     isApproved ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
      include: {
        prisoner: { select: { firstName: true, lastName: true } },
        schedule: { select: { startTime: true, endTime: true } },
        visitorProfile: { select: { userId: true } },
      },
    });

    // Notify the visitor — this was previously missing entirely: approving
    // or rejecting a request updated the database but never told the
    // visitor anything happened, so their Notifications screen stayed
    // empty regardless of real activity on their requests.
    try {
      await notificationService.send({
        userId: updated.visitorProfile.userId,
        type:   isApproved ? 'VISIT_APPROVED' : 'VISIT_REJECTED',
        title:  isApproved ? 'Visit Approved' : 'Visit Request Rejected',
        body:   isApproved
          ? `Your visit to ${updated.prisoner.firstName} ${updated.prisoner.lastName} has been approved. Your QR code is ready.`
          : `Your visit request to ${updated.prisoner.firstName} ${updated.prisoner.lastName} was rejected${dto.rejectionReason ? `: ${dto.rejectionReason}` : '.'}`,
        visitRequestId: updated.id,
      });
    } catch {
      // Notification failure must never block the actual approve/reject
      // decision from succeeding — the officer's action already committed.
    }

    return updated;
  }

  async cancel(id: string, dto: CancelRequestDto, userId: string) {
    const request = await prisma.visitRequest.findUniqueOrThrow({
      where: { id },
      include: { visitorProfile: true },
    });
    // Visitor can cancel their own; officer/admin can cancel any
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const isOwner = request.visitorProfile.userId === userId;
    if (!isOwner && user.role === 'VISITOR') throw new Error('Cannot cancel another visitor\'s request');
    if (!['PENDING', 'APPROVED'].includes(request.status)) throw new Error('Request cannot be cancelled in its current state');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.visitRequest.update({
        where: { id },
        data: { status: 'CANCELLED', cancellationReason: dto.cancellationReason, cancelledAt: new Date() },
      });
      // Free up the slot
      await tx.visitSchedule.update({
        where: { id: request.scheduleId },
        data: {
          currentBookings: { decrement: 1 },
          status: 'OPEN',
        },
      });
      return updated;
    });
  }

  /**
   * Real aggregate counts for the visitor's own dashboard — deliberately a
   * separate endpoint rather than having the client count client-side from
   * whatever page of results it happens to have fetched (e.g. the 5 most
   * recent requests), which undercounts anything beyond that page.
   */
  async getMyStats(visitorUserId: string) {
    const visitorProfile = await prisma.visitorProfile.findUnique({ where: { userId: visitorUserId } });
    if (!visitorProfile) {
      return { pending: 0, approved: 0, rejected: 0, completed: 0, pendingContactRequests: 0 };
    }

    const [pending, approved, rejected, completed, pendingContactRequests] = await Promise.all([
      prisma.visitRequest.count({ where: { visitorProfileId: visitorProfile.id, status: 'PENDING' } }),
      prisma.visitRequest.count({ where: { visitorProfileId: visitorProfile.id, status: 'APPROVED' } }),
      prisma.visitRequest.count({ where: { visitorProfileId: visitorProfile.id, status: 'REJECTED' } }),
      prisma.visitRequest.count({ where: { visitorProfileId: visitorProfile.id, status: 'COMPLETED' } }),
      // A visitor's own contact requests still awaiting review — this is
      // what was previously invisible anywhere on the visitor's dashboard.
      prisma.approvedVisitorPrisoner.count({
        where: { visitorProfileId: visitorProfile.id, isActive: false, approvedByUserId: null },
      }),
    ]);

    return { pending, approved, rejected, completed, pendingContactRequests };
  }

  async findByVisitor(visitorUserId: string, query: { page?: unknown; limit?: unknown; status?: string }) {
    await this.expireUncheckedApprovals();
    const { page, limit, skip } = parsePagination(query);
    const visitorProfile = await prisma.visitorProfile.findUnique({ where: { userId: visitorUserId } });
    if (!visitorProfile) return { requests: [], pagination: buildPagination(page, limit, 0) };

    const where: any = { visitorProfileId: visitorProfile.id };
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.visitRequest.findMany({
        where, skip, take: limit,
        include: {
          prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
          schedule: { select: { startTime: true, endTime: true, label: true, prison: { select: { name: true, code: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitRequest.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  async findByPrison(prisonId: string, query: { page?: unknown; limit?: unknown; status?: string; date?: string }) {
    await this.expireUncheckedApprovals();
    const { page, limit, skip } = parsePagination(query);
    const where: any = { schedule: { prisonId } };
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.visitRequest.findMany({
        where, skip, take: limit,
        include: {
          visitorProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true, nationalId: true } } } },
          prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true, cellBlock: true } },
          schedule: { select: { startTime: true, endTime: true, label: true } },
          processedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitRequest.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  async getById(id: string) {
    return prisma.visitRequest.findUniqueOrThrow({
      where: { id },
      include: {
        visitorProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true, nationalId: true } } } },
        prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true, cellBlock: true } },
        schedule: { select: { startTime: true, endTime: true, label: true, prison: { select: { name: true, code: true } } } },
        processedBy: { select: { firstName: true, lastName: true } },
        visitLog: true,
      },
    });
  }

  /**
   * Officers should only ever see visitors/requests for the prison they're
   * actually assigned to — not every request across every facility in the
   * system. Admins pass role !== 'PRISON_OFFICER' and always get the full
   * cross-prison view. An officer not yet assigned to a specific facility
   * (assignedPrisonId null) falls back to the previous unscoped behaviour
   * rather than being shown literally nothing.
   */
  /**
   * Same lazy-check pattern as expirePastSchedules() — no cron scheduler
   * exists in this backend, so this runs whenever an officer's request
   * list is actually fetched (which happens constantly — every dashboard
   * load). Finds checked-in visits whose scheduled slot has already ended
   * and that haven't been notified about yet, notifies every officer
   * assigned to that prison (not just whoever did the original check-in,
   * since shifts change), and marks them so this doesn't repeat on every
   * subsequent fetch.
   */
  private async notifyOverdueCheckouts() {
    const overdueLogs = await prisma.visitLog.findMany({
      where: {
        actualCheckoutTime: null,
        overdueNotifiedAt: null,
        visitRequest: { schedule: { endTime: { lt: new Date() } } },
      },
      include: {
        visitRequest: {
          include: {
            visitorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
            prisoner: { select: { firstName: true, lastName: true } },
            schedule: { select: { prisonId: true } },
          },
        },
      },
    });

    if (overdueLogs.length === 0) return;

    for (const log of overdueLogs) {
      const visitorName = log.visitRequest.visitorProfile?.user
        ? `${log.visitRequest.visitorProfile.user.firstName} ${log.visitRequest.visitorProfile.user.lastName}` : 'A visitor';
      const prisonerName = log.visitRequest.prisoner
        ? `${log.visitRequest.prisoner.firstName} ${log.visitRequest.prisoner.lastName}` : 'a prisoner';
      const prisonId = log.visitRequest.schedule?.prisonId;

      const officers = prisonId
        ? await prisma.user.findMany({ where: { role: 'PRISON_OFFICER', assignedPrisonId: prisonId }, select: { id: true } })
        : [];

      await Promise.allSettled([
        ...officers.map((o) =>
          notificationService.send({
            userId: o.id,
            type: 'VISIT_OVERDUE',
            title: 'Visit Needs Check-Out',
            body: `${visitorName}'s visit with ${prisonerName} has ended. Please check them out.`,
          })
        ),
        prisma.visitLog.update({ where: { id: log.id }, data: { overdueNotifiedAt: new Date() } }),
      ]);
    }
  }

  async allPrisonRequests(query: { status?: string; page?: unknown; limit?: unknown }, requestorId: string, requestorRole: string) {
    await this.expireUncheckedApprovals();
    if (requestorRole === 'PRISON_OFFICER') await this.notifyOverdueCheckouts();
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.status) where.status = query.status;

    if (requestorRole === 'PRISON_OFFICER') {
      const officer = await prisma.user.findUnique({ where: { id: requestorId }, select: { assignedPrisonId: true } });
      if (officer?.assignedPrisonId) {
        where.schedule = { prisonId: officer.assignedPrisonId };
      }
    }

    const [requests, total] = await Promise.all([
      prisma.visitRequest.findMany({
        where, skip, take: limit,
        include: {
          visitorProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true, nationalId: true } } } },
          prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true, cellBlock: true } },
          schedule: { select: { startTime: true, endTime: true, label: true, prison: { select: { name: true, code: true } } } },
          processedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitRequest.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }
}

export const visitRequestService = new VisitRequestService();
