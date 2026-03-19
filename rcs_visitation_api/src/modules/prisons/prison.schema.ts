import { z } from 'zod';

export const createPrisonSchema = z.object({
  name:        z.string().min(3).max(100),
  code:        z.string().min(3).max(20).toUpperCase(),
  district:    z.string(),
  sector:      z.string().optional(),
  address:     z.string(),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
  contactPhone:z.string().optional(),
  contactEmail:z.string().email().optional(),
  capacity:    z.number().int().positive(),
  maxVisitorsPerSlot:          z.number().int().positive().default(20),
  visitDurationMinutes:        z.number().int().positive().default(30),
  maxVisitsPerPrisonerPerWeek: z.number().int().positive().default(2),
  visitingDaysConfig: z.object({
    mon: z.boolean(), tue: z.boolean(), wed: z.boolean(),
    thu: z.boolean(), fri: z.boolean(), sat: z.boolean(), sun: z.boolean(),
  }).optional(),
});

export const updatePrisonSchema = createPrisonSchema.partial();
export type CreatePrisonDto = z.infer<typeof createPrisonSchema>;
export type UpdatePrisonDto = z.infer<typeof updatePrisonSchema>;
