import { prisma } from '../../config/prisma';
import { UpdateUserRoleDto, UpdateUserStatusDto, ListUsersQuery, UpdatePushTokenDto, UpdateMyProfileDto, AssignPrisonDto, CreateOfficerDto, CompleteSetupDto } from './user.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { hashPassword, comparePassword } from '../../shared/utils/bcrypt';
import { emailService } from '../../shared/services/email.service';
import { randomBytes } from 'crypto';

// Safe select — never return passwordHash
const USER_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  gender: true, dateOfBirth: true, nationalId: true, profilePhoto: true,
  role: true, status: true, preferredLang: true,
  emailVerified: true, phoneVerified: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
  expoPushToken: true,
  assignedPrisonId: true,
  assignedPrison: { select: { id: true, name: true, code: true } },
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

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    if (dto.nationalId) {
      const existing = await prisma.user.findUnique({ where: { nationalId: dto.nationalId } });
      if (existing && existing.id !== userId) {
        throw new Error('This National ID is already registered to another account');
      }
    }
    if (dto.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing && existing.id !== userId) {
        throw new Error('This phone number is already registered to another account');
      }
    }
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      select: USER_SELECT,
    });
  }

  /**
   * Admin creates a Prison Officer account with no usable password — the
   * officer sets their own via a one-time code emailed to them (see
   * completeSetup). Free-of-cost delivery via Gmail SMTP (emailService).
   */
  async createOfficer(dto: CreateOfficerDto) {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { phone: dto.phone }] } });
    if (existing) throw new Error('Email or phone is already registered');

    // An unguessable, unusable placeholder — login is impossible until the
    // officer completes setup and this gets overwritten with a real hash.
    const placeholderHash = await hashPassword(randomBytes(32).toString('hex'));

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        assignedPrisonId: dto.assignedPrisonId,
        role: 'PRISON_OFFICER',
        status: 'ACTIVE',
        passwordHash: placeholderHash,
      },
      select: USER_SELECT,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp); // reuse bcrypt — OTP is just a short-lived secret too
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: otpHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    const emailResult = await emailService.sendOfficerSetupOtp(dto.email, dto.firstName, otp);

    return {
      user,
      // Only surfaced to the admin if email delivery actually failed, so
      // they have a fallback way to give the officer their code (e.g. by
      // phone) instead of the account being stuck with no way to reach it.
      emailSent: emailResult.success,
      setupOtp: emailResult.success ? undefined : otp,
    };
  }

  /**
   * Officer (or any account created without a usable password) verifies
   * their emailed OTP and sets their real password for the first time.
   */
  async completeSetup(dto: CompleteSetupDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new Error('Invalid code or email');

    const pendingReset = await prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!pendingReset) throw new Error('Invalid or expired code');

    const otpValid = await comparePassword(dto.otp, pendingReset.token);
    if (!otpValid) throw new Error('Invalid or expired code');

    const newHash = await hashPassword(dto.newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash, emailVerified: true } }),
      prisma.passwordReset.update({ where: { id: pendingReset.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true };
  }

  async assignPrison(userId: string, dto: AssignPrisonDto) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== 'PRISON_OFFICER') {
      throw new Error('Only prison officers can be assigned to a facility');
    }
    return prisma.user.update({
      where: { id: userId },
      data: { assignedPrisonId: dto.prisonId },
      select: USER_SELECT,
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
