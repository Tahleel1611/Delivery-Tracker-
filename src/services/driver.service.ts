import { DeliveryStatus, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/errors';
import type { UpdateDeliveryStatusInput } from '../schemas/driver.schema';

const startOfUtcDay = (date: Date): Date => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const endOfUtcDay = (date: Date): Date => {
  const end = startOfUtcDay(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
};

const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  READY_FOR_DISPATCH: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: []
};

export async function getDriverManifest(database: PrismaClient, driverId: string) {
  const driver = await database.driver.findUnique({
    where: { id: driverId },
    select: { id: true, name: true, status: true }
  });

  if (!driver) {
    throw new AppError(404, 'DRIVER_NOT_FOUND', 'The driver was not found.');
  }

  const now = new Date();
  const deliveries = await database.delivery.findMany({
    where: {
      assignedDriverId: driverId,
      createdAt: { gte: startOfUtcDay(now), lt: endOfUtcDay(now) }
    },
    orderBy: [{ status: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      orderRef: true,
      customerPhone: true,
      deliveryAddress: true,
      status: true,
      assignedDriverId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { driver, deliveries };
}

export async function updateDeliveryStatus(
  database: PrismaClient,
  deliveryId: string,
  input: UpdateDeliveryStatusInput
) {
  return database.$transaction(async (transaction) => {
    const delivery = await transaction.delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, orderRef: true, status: true, assignedDriverId: true }
    });

    if (!delivery) {
      throw new AppError(404, 'DELIVERY_NOT_FOUND', 'The delivery was not found.');
    }

    if (delivery.assignedDriverId !== input.driverId) {
      throw new AppError(403, 'DRIVER_NOT_ASSIGNED', 'The driver is not assigned to this delivery.');
    }

    const nextStatus = input.status as DeliveryStatus;
    if (!allowedTransitions[delivery.status].includes(nextStatus)) {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', `A delivery cannot move from ${delivery.status} to ${nextStatus}.`);
    }

    const updatedDelivery = await transaction.delivery.update({
      where: { id: deliveryId },
      data: { status: nextStatus },
      select: {
        id: true,
        orderRef: true,
        customerPhone: true,
        deliveryAddress: true,
        status: true,
        assignedDriverId: true,
        trackingToken: { select: { token: true } },
        updatedAt: true
      }
    });

    await transaction.deliveryStatusLog.create({
      data: {
        deliveryId,
        driverId: input.driverId,
        status: nextStatus,
        ...(input.lat !== undefined ? { lat: input.lat } : {}),
        ...(input.lng !== undefined ? { lng: input.lng } : {})
      }
    });

    return updatedDelivery;
  });
}
