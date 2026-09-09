import { z } from 'zod';

export const podDriverSchema = z.object({
  driverId: z.string().uuid()
}).strict();

export type PodDriverInput = z.infer<typeof podDriverSchema>;