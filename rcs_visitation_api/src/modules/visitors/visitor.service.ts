import { prisma } from '../../config/prisma';
import { UpdateVisitorProfileDto, BanVisitorDto, LinkPrisonerDto, RequestContactDto, RejectContactRequestDto } from './visitor.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';

const VISITOR_SELECT = {
  id: true, district: true, sector: true, cell: true,
  emergencyContactName: true, emergencyContactPhone: true,
  isBanned: true, bannedReason: true, bannedAt: true, bannedUntil: true,
  totalVisitsCount: true, lastVisitAt: true, createdAt: true, updatedAt: true,
  user: {
    select: {
      id: true, email: true, phone: true,
      firstName: true, lastName: true, gender: true,
      nationalId: true, profilePhoto: true, status: true,
    },
  },
  approvedPrisoners: {
    where: { isActive: true },
    select: {
      id: true, relationship: true, approvedAt: true,
      prisoner: { select: { id: true, prisonerNumber: true, firstName: true, lastName: true, prison: { select: { name: true, code: true } } } },
    },
  },
} as const;

export class VisitorService {

  async findAll(query: { page?: unknown; limit?: unknown; search?: string; isBanned?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.isBanned === 'true') where.isBanned = true;
    if (query.search) {
      where.user = {
        OR: [
          { firstName:  { contains: query.search, mode: 'insensitive' } },
          { lastName:   { contains: query.search, mode: 'insensitive' } },
          { email:      { contains: query.search, mode: 'insensitive' } },
          { nationalId: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }
    const [visitors, total] = await Promise.all([
      prisma.visitorProfile.findMany({ where, skip, take: limit, select: VISITOR_SELECT, orderBy: { createdAt: 'desc' } }),
      prisma.visitorProfile.count({ where }),
    ]);
    return { visitors, pagination: buildPagination(page, limit, total) };
  }

  async findById(id: string) {
    return prisma.visitorProfile.findUniqueOrThrow({ where: { id }, select: VISITOR_SELECT });
  }

  async findByUserId(userId: string) {
    return prisma.visitorProfile.findUniqueOrThrow({ where: { userId }, select: VISITOR_SELECT });
  }

  async update(id: string, dto: UpdateVisitorProfileDto) {
    return prisma.visitorProfile.update({ where: { id }, data: dto, select: VISITOR_SELECT });
  }

  async updateMyProfile(userId: string, dto: UpdateVisitorProfileDto) {
    const profile = await prisma.visitorProfile.findUniqueOrThrow({ where: { userId } });
    return prisma.visitorProfile.update({ where: { id: profile.id }, data: dto, select: VISITOR_SELECT });
  }

  async ban(id: string, dto: BanVisitorDto) {
    return prisma.visitorProfile.update({
      where: { id },
      data: {
        isBanned:    dto.isBanned,
        bannedReason:dto.isBanned ? dto.bannedReason : null,
        bannedAt:    dto.isBanned ? new Date() : null,
        bannedUntil: dto.isBanned && dto.bannedUntil ? new Date(dto.bannedUntil) : null,
      },
      select: VISITOR_SELECT,
    });
  }

  async linkPrisoner(visitorProfileId: string, dto: LinkPrisonerDto, approvedByUserId: string) {
    // Verify prisoner exists
    await prisma.prisoner.findUniqueOrThrow({ where: { id: dto.prisonerId } });

    return prisma.approvedVisitorPrisoner.upsert({
      where: { visitorProfileId_prisonerId: { visitorProfileId, prisonerId: dto.prisonerId } },
      update: { isActive: true, relationship: dto.relationship, notes: dto.notes },
      create: {
        visitorProfileId,
        prisonerId:      dto.prisonerId,
        relationship:    dto.relationship,
        notes:           dto.notes,
        approvedByUserId,
      },
    });
  }

  async unlinkPrisoner(visitorProfileId: string, prisonerId: string) {
    return prisma.approvedVisitorPrisoner.update({
      where: { visitorProfileId_prisonerId: { visitorProfileId, prisonerId } },
      data:  { isActive: false },
    });
  }

  async getVisitHistory(visitorProfileId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const [requests, total] = await Promise.all([
      prisma.visitRequest.findMany({
        where: { visitorProfileId },
        skip, take: limit,
        include: {
          prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
          schedule: { select: { startTime: true, endTime: true, prison: { select: { name: true, code: true } } } },
          visitLog:  { select: { durationMinutes: true, incidentType: true, incidentFlagged: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visitRequest.count({ where: { visitorProfileId } }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  async requestContact(userId: string, dto: RequestContactDto) {
    const profile = await prisma.visitorProfile.findUniqueOrThrow({ where: { userId } });

    const prisoner = await prisma.prisoner.findUniqueOrThrow({ where: { id: dto.prisonerId } });
    if (prisoner.status !== 'ACTIVE') {
      throw new Error('This prisoner is not currently available for visits');
    }

    return prisma.approvedVisitorPrisoner.upsert({
      where: { visitorProfileId_prisonerId: { visitorProfileId: profile.id, prisonerId: dto.prisonerId } },
      // Resubmitting after a rejection: reopen as pending again.
      update: { isActive: false, approvedByUserId: null, relationship: dto.relationship, notes: dto.notes ?? null },
      create: {
        visitorProfileId: profile.id,
        prisonerId:        dto.prisonerId,
        relationship:      dto.relationship,
        notes:             dto.notes,
        isActive:          false,       // not yet approved
        approvedByUserId:  null,        // null == pending review
      },
    });
  }

  async getMyContactRequests(userId: string) {
    const profile = await prisma.visitorProfile.findUniqueOrThrow({ where: { userId } });
    return prisma.approvedVisitorPrisoner.findMany({
      where: { visitorProfileId: profile.id },
      include: { prisoner: { select: { id: true, firstName: true, lastName: true, prisonerNumber: true, prison: { select: { name: true } } } } },
      orderBy: { approvedAt: 'desc' },
    });
  }

  /** Admin/Officer: contact requests awaiting review (approvedByUserId is null). */
  async getPendingContactRequests(query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where = { isActive: false, approvedByUserId: null };
    const [requests, total] = await Promise.all([
      prisma.approvedVisitorPrisoner.findMany({
        where, skip, take: limit,
        include: {
          visitorProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true, nationalId: true } } } },
          prisoner:        { select: { id: true, firstName: true, lastName: true, prisonerNumber: true, prison: { select: { name: true } } } },
        },
        orderBy: { approvedAt: 'asc' }, // oldest pending first
      }),
      prisma.approvedVisitorPrisoner.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  async approveContactRequest(id: string, approvedByUserId: string) {
    const updated = await prisma.approvedVisitorPrisoner.update({
      where: { id },
      data:  { isActive: true, approvedByUserId, notes: null },
      include: {
        visitorProfile: { select: { userId: true } },
        prisoner:        { select: { firstName: true, lastName: true } },
      },
    });
    try {
      await notificationService.send({
        userId: updated.visitorProfile.userId,
        type:   'SYSTEM_ALERT',
        title:  'Contact Request Approved',
        body:   `You can now book visits to ${updated.prisoner.firstName} ${updated.prisoner.lastName}.`,
      });
    } catch {
      // Non-fatal
    }
    return updated;
  }

  async rejectContactRequest(id: string, dto: RejectContactRequestDto) {
    const updated = await prisma.approvedVisitorPrisoner.update({
      where: { id },
      // Stays isActive:false / approvedByUserId:null (still "not approved"),
      // but the rejection reason is now visible to the visitor via notes.
      data:  { notes: dto.reason },
      include: {
        visitorProfile: { select: { userId: true } },
        prisoner:        { select: { firstName: true, lastName: true } },
      },
    });
    try {
      await notificationService.send({
        userId: updated.visitorProfile.userId,
        type:   'SYSTEM_ALERT',
        title:  'Contact Request Rejected',
        body:   `Your request to visit ${updated.prisoner.firstName} ${updated.prisoner.lastName} was rejected: ${dto.reason}`,
      });
    } catch {
      // Non-fatal
    }
    return updated;
  }
}

export const visitorService = new VisitorService();
