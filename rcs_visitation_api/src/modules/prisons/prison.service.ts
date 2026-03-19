import { prisma } from '../../config/prisma';
import { CreatePrisonDto, UpdatePrisonDto } from './prison.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

export class PrisonService {
  async create(dto: CreatePrisonDto) {
    return prisma.prison.create({ data: dto });
  }

  async findAll(query: { page?: unknown; limit?: unknown; district?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where = query.district ? { district: query.district, isActive: true } : { isActive: true };
    const [prisons, total] = await Promise.all([
      prisma.prison.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.prison.count({ where }),
    ]);
    return { prisons, pagination: buildPagination(page, limit, total) };
  }

  async findById(id: string) {
    return prisma.prison.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, dto: UpdatePrisonDto) {
    return prisma.prison.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    return prisma.prison.update({ where: { id }, data: { isActive: false } });
  }
}

export const prisonService = new PrisonService();
