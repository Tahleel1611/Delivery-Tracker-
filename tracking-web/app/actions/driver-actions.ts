'use server';

import { DeliveryStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getAuthorizedUser, type ActionResult } from '../../lib/authorization';

const transitions: Record<DeliveryStatus, DeliveryStatus | null> = {
  READY_FOR_DISPATCH: DeliveryStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: DeliveryStatus.DELIVERED,
  DELIVERED: null,
  FAILED: null,
  CANCELLED: null
};

export async function updateDeliveryStatusAction(
  deliveryId: string,
  nextStatus: DeliveryStatus,
  coordinates?: { lat?: number; lng?: number }
): Promise<ActionResult<{ id: string; status: DeliveryStatus }>> {
  const driver = await getAuthorizedUser(Role.DRIVER);
  if (!driver) return { success: false, error: 'You are not authorized to update deliveries.' };
  if (nextStatus !== DeliveryStatus.OUT_FOR_DELIVERY && nextStatus !== DeliveryStatus.DELIVERED) {
    return { success: false, error: 'That status is not available to drivers.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findFirst({
        where: { id: deliveryId, assignedUserId: driver.id },
        select: { id: true, status: true }
      });
      if (!delivery) return { kind: 'error' as const, message: 'Assigned delivery not found.' };
      if (delivery.status === nextStatus) return { kind: 'success' as const, id: delivery.id, status: delivery.status };
      if (transitions[delivery.status] !== nextStatus) return { kind: 'error' as const, message: 'Invalid delivery status transition.' };

      const updated = await tx.delivery.updateMany({
        where: { id: delivery.id, assignedUserId: driver.id, status: delivery.status },
        data: { status: nextStatus }
      });
      if (updated.count !== 1) return { kind: 'error' as const, message: 'Delivery changed. Refresh and try again.' };

      await tx.order.updateMany({ where: { delivery: { id: delivery.id } }, data: { status: nextStatus } });
      await tx.statusLog.create({
        data: {
          deliveryId: delivery.id,
          actorId: driver.id,
          status: nextStatus,
          lat: coordinates?.lat,
          lng: coordinates?.lng
        }
      });
      await tx.notificationAttempt.upsert({
        where: { deliveryId_status: { deliveryId: delivery.id, status: nextStatus } },
        create: {
          deliveryId: delivery.id,
          status: nextStatus,
          idempotencyKey: `${delivery.id}:${nextStatus}`
        },
        update: {}
      });
      return { kind: 'success' as const, id: delivery.id, status: nextStatus };
    });

    return result.kind === 'success'
      ? { success: true, data: { id: result.id, status: result.status } }
      : { success: false, error: result.message };
  } catch {
    return { success: false, error: 'Unable to update delivery status.' };
  }
}