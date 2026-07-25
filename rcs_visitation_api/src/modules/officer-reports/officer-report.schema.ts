import { z } from 'zod';

export const createReportRequestSchema = z.object({
  // Omit targetOfficerId entirely (or send null) to broadcast to every officer
  targetOfficerId: z.string().uuid().optional().nullable(),
  title:   z.string().min(3).max(150),
  message: z.string().max(500).optional(),
});

export const updateOfficerReportSchema = z.object({
  title:       z.string().min(3).max(150).optional(),
  description: z.string().max(1000).optional(),
});

export const createOfficerReportMetaSchema = z.object({
  title:           z.string().min(3).max(150),
  description:     z.string().max(1000).optional(),
  visitLogId:      z.string().uuid().optional(),
  reportRequestId: z.string().uuid().optional(),
});

export type CreateReportRequestDto    = z.infer<typeof createReportRequestSchema>;
export type UpdateOfficerReportDto    = z.infer<typeof updateOfficerReportSchema>;
export type CreateOfficerReportMetaDto = z.infer<typeof createOfficerReportMetaSchema>;
