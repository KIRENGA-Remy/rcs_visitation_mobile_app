import { z } from 'zod';

export const upsertSettingSchema = z.object({
  key:         z.string().min(2).max(100),
  value:       z.string().max(500),
  description: z.string().max(300).optional(),
});

export const bulkUpsertSchema = z.object({
  settings: z.array(z.object({
    key:         z.string(),
    value:       z.string(),
    description: z.string().optional(),
  })).min(1),
});

// Known setting keys and their descriptions
export const KNOWN_SETTINGS = {
  max_visitors_per_slot:           'Maximum number of visitors allowed in one time slot',
  visit_duration_minutes:          'Default duration of each visit in minutes',
  max_visits_per_prisoner_per_week:'Maximum visits a prisoner can receive per week',
  booking_advance_days:            'How many days in advance a visitor can book',
  check_in_grace_minutes:          'Minutes before slot start that check-in is allowed',
  qr_code_expiry_hours:            'Hours until a generated QR code expires',
  require_approved_visitor_list:   'Whether visitors must be pre-approved before booking (true/false)',
  allow_walk_in_visits:            'Whether walk-in visits without prior booking are allowed (true/false)',
} as const;

export type UpsertSettingDto = z.infer<typeof upsertSettingSchema>;
export type BulkUpsertDto    = z.infer<typeof bulkUpsertSchema>;
