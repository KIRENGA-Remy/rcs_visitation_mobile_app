import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL:           z.string().url(),
  JWT_SECRET:             z.string().min(32),
  JWT_EXPIRES_IN:         z.string().default('7d'),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  PORT:                   z.coerce.number().default(3000),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX:             z.string().default('/api/v1'),
  BCRYPT_ROUNDS:          z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS:   z.coerce.number().default(900000),
  RATE_LIMIT_MAX:         z.coerce.number().default(100),
  ADMIN_PASSWORD:         z.string().min(8),
  OFFICER_PASSWORD:       z.string().min(8),
  VISITOR_PASSWORD:       z.string().min(8)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
