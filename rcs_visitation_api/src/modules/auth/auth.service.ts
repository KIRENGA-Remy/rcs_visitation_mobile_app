import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../shared/utils/bcrypt';
import { signAccessToken, signRefreshToken } from '../../shared/utils/jwt';
import { RegisterDto, LoginDto } from './auth.schema';

export class AuthService {

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) throw new Error('Email or phone already registered');

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email:      dto.email,
        phone:      dto.phone,
        passwordHash,
        firstName:  dto.firstName,
        lastName:   dto.lastName,
        role:       dto.role,
        nationalId: dto.nationalId,
        gender:     dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        // Auto-create VisitorProfile if role is VISITOR
        visitorProfile: dto.role === 'VISITOR' ? { create: {} } : undefined,
      },
      select: {
        id: true, email: true, phone: true, firstName: true,
        lastName: true, role: true, createdAt: true,
      },
    });

    const accessToken  = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
      },
    });

    if (!user) throw new Error('Invalid credentials');
    if (user.status !== 'ACTIVE') throw new Error('Account is suspended or inactive');

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken  = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user.id);

    return {
      user: {
        id: user.id, email: user.email, phone: user.phone,
        firstName: user.firstName, lastName: user.lastName, role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async getMe(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, status: true, nationalId: true, profilePhoto: true,
        preferredLang: true, createdAt: true,
        visitorProfile: {
          select: {
            id: true, district: true, isBanned: true, totalVisitsCount: true, lastVisitAt: true,
          },
        },
      },
    });
  }
}

export const authService = new AuthService();
