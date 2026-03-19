import { z } from 'zod';

export const checkInSchema = z.object({
  visitRequestId:        z.string().uuid(),
  actualAdultsPresent:   z.number().int().min(0),
  actualChildrenPresent: z.number().int().min(0).default(0),
  itemsCarriedIn:        z.string().optional(),
  officerNotes:          z.string().optional(),
});

export const checkOutSchema = z.object({
  incidentType:       z.enum(['NONE', 'CONTRABAND', 'BEHAVIOUR', 'OVERSTAY', 'UNAUTHORIZED', 'OTHER']).default('NONE'),
  incidentNotes:      z.string().optional(),
  itemsConfiscated:   z.string().optional(),
  officerNotes:       z.string().optional(),
  visitQuality:       z.enum(['NORMAL', 'TENSE', 'EMOTIONAL']).optional(),
}).refine(d => d.incidentType === 'NONE' || !!d.incidentNotes, {
  message: 'Incident notes are required when an incident is recorded',
  path: ['incidentNotes'],
});

export type CheckInDto  = z.infer<typeof checkInSchema>;
export type CheckOutDto = z.infer<typeof checkOutSchema>;
