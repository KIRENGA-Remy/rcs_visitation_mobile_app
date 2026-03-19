import { z } from 'zod';

export const updateVisitorProfileSchema = z.object({
  district:              z.string().max(100).optional(),
  sector:                z.string().max(100).optional(),
  cell:                  z.string().max(100).optional(),
  emergencyContactName:  z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
});

export const banVisitorSchema = z.object({
  isBanned:    z.boolean(),
  bannedReason:z.string().max(500).optional(),
  bannedUntil: z.string().datetime().optional(),
});

export const linkPrisonerSchema = z.object({
  prisonerId:   z.string().uuid(),
  relationship: z.string().min(2).max(50),
  notes:        z.string().max(300).optional(),
});

export type UpdateVisitorProfileDto = z.infer<typeof updateVisitorProfileSchema>;
export type BanVisitorDto           = z.infer<typeof banVisitorSchema>;
export type LinkPrisonerDto         = z.infer<typeof linkPrisonerSchema>;
