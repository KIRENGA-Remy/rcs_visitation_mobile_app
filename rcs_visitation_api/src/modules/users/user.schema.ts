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

// Self-service update — deliberately excludes role, status, email: those
// require ADMIN (see updateUserRoleSchema / updateUserStatusSchema above).
// This exists so a user who registered without a National ID (optional at
// signup) can add one later, e.g. before their first "request to visit".
export const updateMyProfileSchema = z.object({
  firstName:    z.string().min(2).max(50).optional(),
  lastName:     z.string().min(2).max(50).optional(),
  phone:        z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  nationalId:   z.string().min(4).max(30).optional(),
  gender:       z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth:  z.string().datetime().optional(),
  // Accepts either a real hosted URL or a base64 data URI — there's no
  // cloud/object storage configured in this backend, so the pragmatic path
  // for now is storing the image directly as a data URI in this column.
  // A real deployment should swap this for actual file upload + storage
  // and keep only a URL here.
  profilePhoto: z.string().refine(
    (v) => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:image/'),
    'Must be a valid URL or image data URI'
  ).optional(),
  preferredLang:z.enum(['rw', 'en']).optional(),
});

// Admin assigns/unassigns which prison a PRISON_OFFICER works at — this is
// what scopes schedule-change notifications to the right officers.
// prisonId: null explicitly un-assigns the officer.
export const assignPrisonSchema = z.object({
  prisonId: z.string().uuid().nullable(),
});

export type UpdateUserRoleDto   = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery      = z.infer<typeof listUsersQuerySchema>;
export type UpdatePushTokenDto  = z.infer<typeof updatePushTokenSchema>;
export type UpdateMyProfileDto  = z.infer<typeof updateMyProfileSchema>;
export type AssignPrisonDto     = z.infer<typeof assignPrisonSchema>;

// Admin creates an officer account with no password — the officer sets
// their own via the OTP-based setup flow (see completeSetupSchema).
export const createOfficerSchema = z.object({
  email:       z.string().email(),
  phone:       z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  firstName:   z.string().min(2).max(50),
  lastName:    z.string().min(2).max(50),
  nationalId:  z.string().optional(),
  assignedPrisonId: z.string().uuid().optional(),
});

/**
 * Admin creates ANOTHER admin account — deliberately a fully separate
 * schema/service/controller/route from createOfficer, not a shared
 * "createStaff(role)" endpoint with a role selector. A single generic form
 * where "role" is just a dropdown value is exactly the kind of design that
 * lets a misclick or a bug grant admin privileges to what was meant to be
 * an officer account (or vice versa). Keeping them as two independent code
 * paths — each hardcoding its own role server-side, with no role field in
 * either request body at all — makes that class of mistake structurally
 * impossible rather than just "unlikely".
 */
export const createAdminSchema = z.object({
  email:      z.string().email(),
  phone:      z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  firstName:  z.string().min(2).max(50),
  lastName:   z.string().min(2).max(50),
  nationalId: z.string().optional(),
});

export const completeSetupSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Must contain uppercase')
                .regex(/[0-9]/, 'Must contain number'),
});

export type CreateOfficerDto  = z.infer<typeof createOfficerSchema>;
export type CreateAdminDto    = z.infer<typeof createAdminSchema>;
export type CompleteSetupDto  = z.infer<typeof completeSetupSchema>;
