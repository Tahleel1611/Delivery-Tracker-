import { z } from 'zod';

export const dispatchWebhookSchema = z.object({
  orderRef: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(7).max(32),
  deliveryAddress: z.string().trim().min(1).max(5000),
  assignedDriverId: z.string().uuid().optional(),
  sourceEventId: z.string().trim().min(1).max(160).optional(),
  eventType: z.string().trim().min(1).max(80).optional(),
  status: z.enum(['READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']).default('READY_FOR_DISPATCH')
}).strict();

export type DispatchWebhookInput = z.infer<typeof dispatchWebhookSchema>;
