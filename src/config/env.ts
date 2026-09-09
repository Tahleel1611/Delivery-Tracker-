import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  LEGACY_WEBHOOK_API_KEY: z.string().min(16),
  DRIVER_JWT_SECRET: z.string().min(32),
  DRIVER_JWT_TTL: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('*'),
  TRACKING_WEB_BASE_URL: z.string().url().default('http://localhost:3001'),
  TRACKING_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OCI_S3_ENDPOINT: z.string().url().optional(),
  OCI_S3_REGION: z.string().default('us-phoenix-1'),
  OCI_S3_NAMESPACE: z.string().optional(),
  OCI_S3_BUCKET: z.string().optional(),
  OCI_S3_ACCESS_KEY: z.string().optional(),
  OCI_S3_SECRET_KEY: z.string().optional(),
  OCI_S3_PUBLIC_BASE_URL: z.string().url().optional(),
  POD_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(5242880),
  LOG_LEVEL: z.string().default('info')
});

export const env = envSchema.parse(process.env);
