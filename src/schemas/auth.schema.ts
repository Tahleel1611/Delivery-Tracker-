import { z } from 'zod';

export const driverLoginSchema = z.object({
  driverId: z.string().uuid()
}).strict();

export type DriverLoginInput = z.infer<typeof driverLoginSchema>;