import { z } from 'zod';

export const driverLoginSchema = z.object({
  username: z.string().trim().min(3).max(120),
  password: z.string().min(12).max(256)
}).strict();

export const refreshDriverSessionSchema = z.object({
  refreshToken: z.string().regex(/^[A-Za-z0-9_-]{40,128}$/)
}).strict();

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;
