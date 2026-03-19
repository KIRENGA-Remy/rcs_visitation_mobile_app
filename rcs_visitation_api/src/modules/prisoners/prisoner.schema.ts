import { z } from 'zod';

export const createPrisonerSchema = z.object({
  prisonId:             z.string().uuid(),
  prisonerNumber:       z.string().min(3).max(30),
  firstName:            z.string().min(2).max(50),
  lastName:             z.string().min(2).max(50),
  dateOfBirth:          z.string().datetime().optional(),
  gender:               z.enum(['MALE', 'FEMALE', 'OTHER']),
  nationalId:           z.string().optional(),
  cellBlock:            z.string().optional(),
  cellNumber:           z.string().optional(),
  admissionDate:        z.string().datetime(),
  expectedReleaseDate:  z.string().datetime().optional(),
  offenseCategory:      z.string().optional(),
});

export const transferPrisonerSchema = z.object({
  newPrisonId:     z.string().uuid(),
  transferNotes:   z.string().optional(),
});

export const restrictVisitsSchema = z.object({
  restricted:         z.boolean(),
  restrictionReason:  z.string().optional(),
  restrictionUntil:   z.string().datetime().optional(),
});

export type CreatePrisonerDto   = z.infer<typeof createPrisonerSchema>;
export type TransferPrisonerDto = z.infer<typeof transferPrisonerSchema>;
export type RestrictVisitsDto   = z.infer<typeof restrictVisitsSchema>;
