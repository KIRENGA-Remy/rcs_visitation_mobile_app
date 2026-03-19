import { prisma } from '../../config/prisma';
import { UpdateVisitorProfileDto, BanVisitorDto, LinkPrisonerDto } from './visitor.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

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
}

export const visitorService = new VisitorService();
