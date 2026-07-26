import { z } from 'zod';

export const createReportRequestSchema = z.object({
  // Omit targetOfficerId entirely (or send null) to broadcast to every officer
  targetOfficerId: z.string().uuid().optional().nullable(),
  title:   z.string().min(3).max(150),
  message: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional(),
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
  // Only meaningful when reportRequestId is absent (a self-initiated
  // report) — which admin to notify. Omit/blank to broadcast to all admins.
  // multipart fields always arrive as strings, so "" must be treated the
  // same as not-provided rather than failing uuid validation.
  sentToAdminId:   z.string().uuid().optional().or(z.literal('')),
});

/**
 * Alternative to file upload — the officer already has the document hosted
 * somewhere (their own Cloudinary account, Google Drive, etc.) and just
 * pastes the link instead of uploading through the app.
 */
export const createOfficerReportFromUrlSchema = z.object({
  title:           z.string().min(3).max(150),
  description:     z.string().max(1000).optional(),
  visitLogId:      z.string().uuid().optional(),
  reportRequestId: z.string().uuid().optional(),
  sentToAdminId:   z.string().uuid().optional().nullable(),
  fileUrl:         z.string().url(),
  fileName:        z.string().min(1).max(255),
});

export type CreateReportRequestDto    = z.infer<typeof createReportRequestSchema>;
export type UpdateOfficerReportDto    = z.infer<typeof updateOfficerReportSchema>;
export type CreateOfficerReportMetaDto = z.infer<typeof createOfficerReportMetaSchema>;
export type CreateOfficerReportFromUrlDto = z.infer<typeof createOfficerReportFromUrlSchema>;
