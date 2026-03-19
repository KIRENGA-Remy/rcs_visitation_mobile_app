import { z } from 'zod';

export const createScheduleSchema = z.object({
  prisonId:    z.string().uuid(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime:   z.string().datetime(),
  endTime:     z.string().datetime(),
  label:       z.string().optional(),
  maxCapacity: z.number().int().positive(),
  visitType:   z.enum(['REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL']).default('REGULAR'),
  notes:       z.string().optional(),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const bulkCreateScheduleSchema = z.object({
  prisonId:     z.string().uuid(),
  startDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:    z.string(),  // e.g. "09:00"
  endTime:      z.string(),  // e.g. "12:00"
  daysOfWeek:   z.array(z.number().min(0).max(6)), // 0=Sun, 1=Mon...
  maxCapacity:  z.number().int().positive(),
  visitType:    z.enum(['REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL']).default('REGULAR'),
  label:        z.string().optional(),
});

export type CreateScheduleDto     = z.infer<typeof createScheduleSchema>;
export type BulkCreateScheduleDto = z.infer<typeof bulkCreateScheduleSchema>;
