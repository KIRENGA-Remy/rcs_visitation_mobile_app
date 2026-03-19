import { z } from 'zod';

export const sendNotificationSchema = z.object({
  userId:        z.string().uuid(),
  type:          z.enum([
    'VISIT_APPROVED','VISIT_REJECTED','VISIT_REMINDER','VISIT_CANCELLED',
    'VISIT_CHECKED_IN','VISIT_COMPLETED','PRISONER_TRANSFERRED',
    'SLOT_OPENING','SYSTEM_ALERT',
  ]),
  channel:       z.enum(['IN_APP','SMS','EMAIL']).default('IN_APP'),
  title:         z.string().min(2).max(150),
  body:          z.string().min(2).max(1000),
  visitRequestId:z.string().uuid().optional(),
});

export const broadcastSchema = z.object({
  role:    z.enum(['VISITOR','PRISON_OFFICER','ADMIN']).optional(),
  prisonId:z.string().uuid().optional(),
  type:    z.enum(['SYSTEM_ALERT','SLOT_OPENING']),
  channel: z.enum(['IN_APP','SMS','EMAIL']).default('IN_APP'),
  title:   z.string().min(2).max(150),
  body:    z.string().min(2).max(1000),
});

export type SendNotificationDto = z.infer<typeof sendNotificationSchema>;
export type BroadcastDto        = z.infer<typeof broadcastSchema>;
