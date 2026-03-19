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

export type UpdateUserRoleDto   = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery      = z.infer<typeof listUsersQuerySchema>;
