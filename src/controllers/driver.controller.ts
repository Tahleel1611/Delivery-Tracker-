import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import {
  deliveryIdParamSchema,
  driverIdParamSchema,
  updateDeliveryStatusSchema
} from '../schemas/driver.schema';
import { getDriverManifest, updateDeliveryStatus } from '../services/driver.service';
import { sendDeliveryStatusNotification } from '../services/notification.service';

export const getDriverDeliveries: RequestHandler = async (request, response, next) => {
  try {
    const { driverId } = driverIdParamSchema.parse(request.params);
    const manifest = await getDriverManifest(prisma, driverId);
    response.status(200).json({ data: manifest, requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};

export const patchDeliveryStatus: RequestHandler = async (request, response, next) => {
  try {
    const { deliveryId } = deliveryIdParamSchema.parse(request.params);
    const input = updateDeliveryStatusSchema.parse(request.body);
    const delivery = await updateDeliveryStatus(prisma, deliveryId, input);
    if ((delivery.status === 'OUT_FOR_DELIVERY' || delivery.status === 'DELIVERED') && delivery.trackingToken) {
      // The mock cannot fail the already-committed delivery transition. A real
      // provider implementation should enqueue retryable work at this boundary.
      try {
        await sendDeliveryStatusNotification({
          orderRef: delivery.orderRef,
          customerPhone: delivery.customerPhone,
          status: delivery.status,
          trackingToken: delivery.trackingToken.token
        });
      } catch (notificationError) {
        console.error('[notification:failed]', notificationError);
      }
    }
    response.status(200).json({ data: delivery, requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};
