import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL:           z.string().url(),
  JWT_SECRET:             z.string().min(32),
  JWT_EXPIRES_IN:         z.string().default('15m'),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT:                   z.coerce.number().default(3000),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX:             z.string().default('/api/v1'),
  BCRYPT_ROUNDS:          z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS:   z.coerce.number().default(900000),
  RATE_LIMIT_MAX:         z.coerce.number().default(100),
  ADMIN_PASSWORD:         z.string().min(8),
  OFFICER_PASSWORD:       z.string().min(8),
  VISITOR_PASSWORD:       z.string().min(8),
  // Free email delivery via Gmail SMTP — used to send officer account
  // setup OTPs. Optional at the schema level so the rest of the app still
  // boots without it configured; emailService itself throws a clear error
  // if something tries to send without these set.
  EMAIL_USER:             z.string().email().optional(),
  EMAIL_APP_PASSWORD:     z.string().optional(),
  // Cloudinary — free tier object storage for report documents and profile
  // photos. Optional at the schema level so the app still boots without it
  // configured; cloudinary.service.ts throws a clear error if something
  // tries to upload without these set.
  CLOUDINARY_CLOUD_NAME:  z.string().optional(),
  CLOUDINARY_API_KEY:     z.string().optional(),
  CLOUDINARY_API_SECRET:  z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
