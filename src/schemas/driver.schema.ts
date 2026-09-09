import { z } from 'zod';

export const driverIdParamSchema = z.object({
  driverId: z.string().uuid()
});

export const deliveryIdParamSchema = z.object({
  deliveryId: z.string().uuid()
});

export const updateDeliveryStatusSchema = z.object({
  driverId: z.string().uuid(),
  status: z.enum(['OUT_FOR_DELIVERY', 'DELIVERED']),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
}).strict();

export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;