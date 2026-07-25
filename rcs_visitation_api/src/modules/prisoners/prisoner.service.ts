import { prisma } from '../../config/prisma';
import { CreatePrisonerDto, TransferPrisonerDto, RestrictVisitsDto, UpdatePrisonerDto, ReleasePrisonerDto } from './prisoner.schema';
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

  /**
   * `status` (ACTIVE/TRANSFERRED/RELEASED/RESTRICTED/DECEASED) and
   * `visitingRestricted` (a boolean) are independent — a prisoner can be
   * ACTIVE *and* visiting-restricted at the same time (e.g. disciplinary
   * action while still held at the same facility), or TRANSFERRED and
   * restricted, etc. Treating "Restricted" as if it were just another
   * mutually-exclusive status value hides prisoners whose actual `status`
   * is ACTIVE/TRANSFERRED but who are, in fact, restricted right now —
   * exactly the bug where a restricted-but-ACTIVE prisoner showed under
   * "Active" with a red Restricted badge, yet the "Restricted" tab itself
   * returned nothing.
   *
   * So: `status` filters on the lifecycle enum as before, but the
   * `restrictedOnly` param filters on the `visitingRestricted` boolean
   * instead of trying to match a `status` value — these can be combined
   * with each other freely.
   */
  async findAll(query: { page?: unknown; limit?: unknown; prisonId?: string; status?: string; restrictedOnly?: unknown; search?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.prisonId) where.prisonId = query.prisonId;
    if (query.status && query.status !== 'RESTRICTED') where.status = query.status;
    if (query.status === 'RESTRICTED' || query.restrictedOnly === 'true' || query.restrictedOnly === true) {
      where.visitingRestricted = true;
    }
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

  /**
   * Visitor-facing prisoner search — used when a visitor is requesting a
   * NEW contact (not yet approved to visit anyone). Deliberately returns a
   * much smaller field set than `findAll` (no dateOfBirth, nationalId,
   * cellBlock/cellNumber, offenseCategory, restriction reason/notes) since
   * this is reachable by any authenticated visitor, not just staff.
   * Only ACTIVE prisoners are searchable — a visitor has no legitimate
   * reason to find a TRANSFERRED/RELEASED/DECEASED prisoner through search.
   */
  async searchForVisitor(query: { prisonId?: string; search?: string; page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    if (!query.prisonId) {
      throw new Error('prisonId is required to search prisoners');
    }
    const where: any = { prisonId: query.prisonId, status: 'ACTIVE' };
    if (query.search) {
      where.OR = [
        { firstName:      { contains: query.search, mode: 'insensitive' } },
        { lastName:       { contains: query.search, mode: 'insensitive' } },
        { prisonerNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const select = {
      id: true, firstName: true, lastName: true, prisonerNumber: true,
      status: true, visitingRestricted: true,
      prison: { select: { id: true, name: true, code: true } },
    } as const;
    const [prisoners, total] = await Promise.all([
      prisma.prisoner.findMany({ where, skip, take: limit, select, orderBy: { lastName: 'asc' } }),
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

  /** General edit — name, cell assignment, offense category, expected release date. */
  async update(id: string, dto: UpdatePrisonerDto) {
    return prisma.prisoner.update({
      where: { id },
      data: {
        ...dto,
        expectedReleaseDate: dto.expectedReleaseDate ? new Date(dto.expectedReleaseDate) : undefined,
      },
    });
  }

  /**
   * Marks a prisoner as released and cancels any future visit activity,
   * same as `transfer` does for the old facility — a released prisoner
   * can't have pending or approved visits sitting against them.
   */
  async release(id: string, dto: ReleasePrisonerDto) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.prisoner.update({
        where: { id },
        data: { status: 'RELEASED', releaseNotes: dto.releaseNotes },
      });
      await tx.visitRequest.updateMany({
        where: { prisonerId: id, status: { in: ['PENDING', 'APPROVED'] } },
        data: { status: 'CANCELLED', cancellationReason: 'Prisoner has been released' },
      });
      return updated;
    });
  }

  /** Reverses a RELEASED/TRANSFERRED status back to ACTIVE, e.g. to correct a mistaken entry. */
  async reactivate(id: string) {
    return prisma.prisoner.update({ where: { id }, data: { status: 'ACTIVE' } });
  }
}

export const prisonerService = new PrisonerService();
