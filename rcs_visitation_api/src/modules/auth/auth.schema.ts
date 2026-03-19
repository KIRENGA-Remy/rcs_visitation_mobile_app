import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  email:       z.string().email(),
  phone:       z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  password:    z.string().min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Must contain uppercase')
                .regex(/[0-9]/, 'Must contain number'),
  firstName:   z.string().min(2).max(50),
  lastName:    z.string().min(2).max(50),
  nationalId:  z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  role:        z.enum([UserRole.VISITOR]).default(UserRole.VISITOR), // public registration = VISITOR only
});

export const loginSchema = z.object({
  emailOrPhone: z.string(),
  password:     z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword:     z.string().min(8)
                    .regex(/[A-Z]/, 'Must contain uppercase')
                    .regex(/[0-9]/, 'Must contain number'),
});

export type RegisterDto      = z.infer<typeof registerSchema>;
export type LoginDto         = z.infer<typeof loginSchema>;
export type ChangePasswordDto= z.infer<typeof changePasswordSchema>;
