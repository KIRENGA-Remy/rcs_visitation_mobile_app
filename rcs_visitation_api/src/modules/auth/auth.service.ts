import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../shared/utils/bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { RegisterDto, LoginDto, ChangePasswordDto } from './auth.schema';

/**
 * BUG FIX: register() and login() each used their own hand-picked, much
 * smaller `select` than getMe() — missing profilePhoto, status,
 * nationalId, preferredLang, emailVerified, phoneVerified, and
 * visitorProfile entirely. Since the mobile app persists whatever user
 * object comes back from register/login as its working copy (and only
 * refetches on an explicit profile update), a user's profile photo — or
 * any of those other fields — appeared to vanish every time they logged
 * out and back in, even though it was sitting in the database untouched
 * the whole time. All three methods now return the exact same shape.
 */
const AUTH_USER_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  role: true, status: true, nationalId: true, profilePhoto: true,
  preferredLang: true, emailVerified: true, phoneVerified: true, createdAt: true,
  visitorProfile: {
    select: {
      id: true, district: true, isBanned: true, totalVisitsCount: true, lastVisitAt: true,
    },
  },
} as const;

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
      select: AUTH_USER_SELECT,
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

    // Re-fetch with the complete shape rather than hand-picking a handful
    // of fields — see AUTH_USER_SELECT's comment for why this matters.
    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: AUTH_USER_SELECT,
    });

    return {
      user: fullUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Exchanges a valid refresh token for a new access token, plus a rotated
   * refresh token. This is what lets the mobile app silently renew a
   * short-lived access token without forcing the user to log in again —
   * WITHOUT this route registered, every access-token expiry (or any 401)
   * becomes an immediate, unrecoverable logout on the client.
   */
  async refresh(refreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('Invalid or expired refresh token');
    if (user.status !== 'ACTIVE') throw new Error('Account is suspended or inactive');

    const accessToken     = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const newRefreshToken = signRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');

    const newHash = await hashPassword(dto.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { success: true };
  }

  async getMe(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: AUTH_USER_SELECT,
    });
  }
}

export const authService = new AuthService();
