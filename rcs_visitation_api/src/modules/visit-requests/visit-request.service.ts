import { prisma } from '../../config/prisma';
import { CreateVisitRequestDto, ProcessRequestDto, CancelRequestDto } from './visit-request.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

export class VisitRequestService {

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
    if (new Date(schedule.startTime) < new Date()) throw new Error('Cannot book a past time slot');

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
    return prisma.visitRequest.update({
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
      },
    });
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

  async findByVisitor(visitorUserId: string, query: { page?: unknown; limit?: unknown; status?: string }) {
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

  async allPrisonRequests(query: { status?: string; page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.status) where.status = query.status;
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
