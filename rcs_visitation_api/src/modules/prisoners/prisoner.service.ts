import { prisma } from '../../config/prisma';
import { CreatePrisonerDto, TransferPrisonerDto, RestrictVisitsDto } from './prisoner.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

export class PrisonerService {
  async create(dto: CreatePrisonerDto) {
    return prisma.prisoner.create({
      data: {
        ...dto,
        dateOfBirth:         dto.dateOfBirth         ? new Date(dto.dateOfBirth)        : undefined,
        admissionDate:       new Date(dto.admissionDate),
        expectedReleaseDate: dto.expectedReleaseDate  ? new Date(dto.expectedReleaseDate) : undefined,
      },
    });
  }

  async findAll(query: { page?: unknown; limit?: unknown; prisonId?: string; status?: string; search?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.prisonId) where.prisonId = query.prisonId;
    if (query.status)   where.status   = query.status;
    if (query.search) {
      where.OR = [
        { firstName:      { contains: query.search, mode: 'insensitive' } },
        { lastName:       { contains: query.search, mode: 'insensitive' } },
        { prisonerNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [prisoners, total] = await Promise.all([
      prisma.prisoner.findMany({
        where, skip, take: limit,
        include: { prison: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prisoner.count({ where }),
    ]);
    return { prisoners, pagination: buildPagination(page, limit, total) };
  }

  async findById(id: string) {
    return prisma.prisoner.findUniqueOrThrow({
      where: { id },
      include: {
        prison: { select: { name: true, code: true, district: true } },
        approvedVisitors: {
          where: { isActive: true },
          include: { visitorProfile: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
        },
      },
    });
  }

  async transfer(id: string, dto: TransferPrisonerDto) {
    const prisoner = await prisma.prisoner.findUniqueOrThrow({ where: { id } });

    return prisma.$transaction(async (tx) => {
      // Update prisoner
      const updated = await tx.prisoner.update({
        where: { id },
        data: {
          prisonId:               dto.newPrisonId,
          status:                 'ACTIVE',
          transferredFromPrisonId: prisoner.prisonId,
          transferredAt:           new Date(),
          transferNotes:           dto.transferNotes,
        },
      });
      // Cancel all pending/approved visit requests for old prison
      await tx.visitRequest.updateMany({
        where: { prisonerId: id, status: { in: ['PENDING', 'APPROVED'] } },
        data: { status: 'CANCELLED', cancellationReason: 'Prisoner transferred to another facility' },
      });
      return updated;
    });
  }

  async restrictVisits(id: string, dto: RestrictVisitsDto) {
    return prisma.prisoner.update({
      where: { id },
      data: {
        visitingRestricted: dto.restricted,
        restrictionReason:  dto.restrictionReason,
        restrictionUntil:   dto.restrictionUntil ? new Date(dto.restrictionUntil) : null,
      },
    });
  }
}

export const prisonerService = new PrisonerService();
