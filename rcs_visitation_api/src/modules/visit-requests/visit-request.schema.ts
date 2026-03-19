import { z } from 'zod';

export const createVisitRequestSchema = z.object({
  prisonerId:       z.string().uuid(),
  scheduleId:       z.string().uuid(),
  visitType:        z.enum(['REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL']).default('REGULAR'),
  purposeNote:      z.string().max(500).optional(),
  numberOfAdults:   z.number().int().min(1).max(5).default(1),
  numberOfChildren: z.number().int().min(0).max(5).default(0),
});

export const processRequestSchema = z.object({
  action:          z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
}).refine(d => d.action !== 'REJECT' || !!d.rejectionReason, {
  message: 'Rejection reason is required when rejecting',
  path: ['rejectionReason'],
});

export const cancelRequestSchema = z.object({
  cancellationReason: z.string().min(5).max(500),
});

export type CreateVisitRequestDto = z.infer<typeof createVisitRequestSchema>;
export type ProcessRequestDto     = z.infer<typeof processRequestSchema>;
export type CancelRequestDto      = z.infer<typeof cancelRequestSchema>;
