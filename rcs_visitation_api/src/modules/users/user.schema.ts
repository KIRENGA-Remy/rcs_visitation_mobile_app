import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['VISITOR', 'PRISON_OFFICER', 'ADMIN']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
  reason: z.string().max(300).optional(),
});

export const listUsersQuerySchema = z.object({
  page:   z.coerce.number().positive().default(1),
  limit:  z.coerce.number().positive().max(100).default(20),
  role:   z.enum(['VISITOR', 'PRISON_OFFICER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  search: z.string().optional(),
});

export const updatePushTokenSchema = z.object({
  expoPushToken: z.string()
    .min(1, 'Push token is required')
    .refine(
      (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['),
      'Invalid Expo push token format. Must start with "ExponentPushToken[" or "ExpoPushToken["'
    ),
});

export const updateMyProfileSchema = z.object({
  firstName:    z.string().min(2).max(50).optional(),
  lastName:     z.string().min(2).max(50).optional(),
  phone:        z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  nationalId:   z.string().min(4).max(30).optional(),
  gender:       z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth:  z.string().datetime().optional(),
  profilePhoto: z.string().refine(
    (v) => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:image/'),
    'Must be a valid URL or image data URI'
  ).optional(),
  preferredLang:z.enum(['rw', 'en']).optional(),
});

export type UpdateUserRoleDto   = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery      = z.infer<typeof listUsersQuerySchema>;
export type UpdatePushTokenDto  = z.infer<typeof updatePushTokenSchema>;
export type UpdateMyProfileDto  = z.infer<typeof updateMyProfileSchema>;
