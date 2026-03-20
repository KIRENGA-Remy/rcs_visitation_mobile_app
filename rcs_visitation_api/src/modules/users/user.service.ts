import { prisma } from '../../config/prisma';
import { UpdateUserRoleDto, UpdateUserStatusDto, ListUsersQuery, UpdatePushTokenDto } from './user.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';

// Safe select — never return passwordHash
const USER_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  gender: true, dateOfBirth: true, nationalId: true, profilePhoto: true,
  role: true, status: true, preferredLang: true,
  emailVerified: true, phoneVerified: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
  expoPushToken: true,
  visitorProfile: {
    select: {
      id: true, district: true, sector: true, cell: true,
      isBanned: true, bannedReason: true, bannedUntil: true,
      totalVisitsCount: true, lastVisitAt: true,
    },
  },
} as const;

export class UserService {

  async findAll(query: ListUsersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.role)   where.role   = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName:  { contains: query.search, mode: 'insensitive' } },
        { email:     { contains: query.search, mode: 'insensitive' } },
        { phone:     { contains: query.search, mode: 'insensitive' } },
        { nationalId:{ contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, select: USER_SELECT, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return { users, pagination: buildPagination(page, limit, total) };
  }

  async findById(id: string) {
    return prisma.user.findUniqueOrThrow({ where: { id }, select: USER_SELECT });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });

    return prisma.$transaction(async (tx) => {
      // If promoting to VISITOR and no profile exists, create one
      if (dto.role === 'VISITOR' && !await tx.visitorProfile.findUnique({ where: { userId: id } })) {
        await tx.visitorProfile.create({ data: { userId: id } });
      }
      return tx.user.update({ where: { id }, data: { role: dto.role }, select: USER_SELECT });
    });
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    return prisma.user.update({
      where: { id },
      data:  { status: dto.status },
      select: USER_SELECT,
    });
  }

  async softDelete(id: string, requestorId: string) {
    if (id === requestorId) throw new Error('You cannot delete your own account');
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.role === 'ADMIN') throw new Error('Admin accounts cannot be deleted via API');

    // Soft delete: set INACTIVE and anonymise PII
    return prisma.user.update({
      where: { id },
      data: {
        status:    'INACTIVE',
        email:     `deleted_${Date.now()}@rcs.deleted`,
        phone:     `deleted_${Date.now()}`,
        firstName: 'Deleted',
        lastName:  'User',
        nationalId: null,
      },
      select: { id: true, status: true },
    });
  }

  async updatePushToken(userId: string, expoPushToken: string) {
    // Validate token format
    if (!expoPushToken || typeof expoPushToken !== 'string') {
      throw new ValidationError('expoPushToken is required and must be a string');
    }
    
    const isValidFormat = 
      expoPushToken.startsWith('ExponentPushToken[') || 
      expoPushToken.startsWith('ExpoPushToken[');
    
    if (!isValidFormat) {
      throw new ValidationError('Invalid Expo push token format');
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.status === 'INACTIVE') {
      throw new ValidationError('Cannot update token for inactive user');
    }
    
    // Update push token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
      select: { id: true, expoPushToken: true },
    });
    
    return updatedUser;
  }
}

export const userService = new UserService();
