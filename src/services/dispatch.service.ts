import { Prisma, PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { createTrackingToken, trackingTokenExpiresAt } from '../lib/tracking-token';
import { DispatchWebhookInput } from '../schemas/webhook.schema';

export interface DispatchResult {
  deliveryId: string;
  orderRef: string;
  status: string;
  trackingToken: string;
  trackingUrl: string;
  duplicate: boolean;
}

export async function ingestDispatch(
  database: PrismaClient,
  payload: DispatchWebhookInput,
  payloadHash: string
): Promise<DispatchResult> {
  try {
    return await database.$transaction(async (transaction) => {
      const existingReceipt = await transaction.webhookReceipt.findUnique({
        where: { payloadHash }
      });

      if (existingReceipt) {
        const existingDelivery = await transaction.delivery.findUnique({
          where: { orderRef: payload.orderRef },
          select: { id: true, orderRef: true, status: true, trackingToken: true }
        });

        if (!existingDelivery) {
          throw new AppError(409, 'RECEIPT_WITHOUT_DELIVERY', 'The webhook receipt exists without its delivery record.');
        }

        return {
          deliveryId: existingDelivery.id,
          orderRef: existingDelivery.orderRef,
          status: existingDelivery.status,
          trackingToken: existingDelivery.trackingToken?.token ?? '',
          trackingUrl: `${env.TRACKING_WEB_BASE_URL}/t/${existingDelivery.trackingToken?.token ?? ''}`,
          duplicate: true
        };
      }

      const delivery = await transaction.delivery.create({
        data: {
          orderRef: payload.orderRef,
          customerPhone: payload.customerPhone,
          deliveryAddress: payload.deliveryAddress,
          status: payload.status,
          ...(payload.assignedDriverId ? { assignedDriverId: payload.assignedDriverId } : {}),
          statusLogs: {
            create: { status: payload.status }
          }
        },
        select: { id: true, orderRef: true, status: true }
      });

      const trackingToken = createTrackingToken();
      await transaction.trackingToken.create({
        data: {
          token: trackingToken,
          deliveryId: delivery.id,
          expiresAt: trackingTokenExpiresAt()
        }
      });

      await transaction.webhookReceipt.create({
        data: {
          payloadHash,
          status: 'PROCESSED',
          processedAt: new Date()
        }
      });

      return {
        deliveryId: delivery.id,
        orderRef: delivery.orderRef,
        status: delivery.status,
        trackingToken,
        trackingUrl: `${env.TRACKING_WEB_BASE_URL}/t/${trackingToken}`,
        duplicate: false
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existingDelivery = await database.delivery.findUnique({
        where: { orderRef: payload.orderRef },
        select: { id: true, orderRef: true, status: true, trackingToken: true }
      });

      if (existingDelivery) {
        return {
          deliveryId: existingDelivery.id,
          orderRef: existingDelivery.orderRef,
          status: existingDelivery.status,
          trackingToken: existingDelivery.trackingToken?.token ?? '',
          trackingUrl: `${env.TRACKING_WEB_BASE_URL}/t/${existingDelivery.trackingToken?.token ?? ''}`,
          duplicate: true
        };
      }
    }
    throw error;
  }
}
