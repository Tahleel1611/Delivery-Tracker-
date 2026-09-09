import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { podDriverSchema } from '../schemas/pod.schema';
import { deliveryIdParamSchema } from '../schemas/driver.schema';
import { uploadPodImage } from '../services/object-storage.service';

export const uploadProofOfDelivery: RequestHandler = async (request, response, next) => {
  try {
    const { deliveryId } = deliveryIdParamSchema.parse(request.params);
    const { driverId } = podDriverSchema.parse(request.body);
    const file = request.file;

    if (!file) {
      throw new AppError(400, 'POD_IMAGE_REQUIRED', 'An image file is required.');
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, status: true, assignedDriverId: true }
    });

    if (!delivery) throw new AppError(404, 'DELIVERY_NOT_FOUND', 'The delivery was not found.');
    if (delivery.assignedDriverId !== driverId) throw new AppError(403, 'DRIVER_NOT_ASSIGNED', 'The driver is not assigned to this delivery.');
    if (delivery.status !== 'DELIVERED') throw new AppError(409, 'DELIVERY_NOT_COMPLETE', 'Proof of Delivery can only be uploaded after delivery.');

    const podImageUrl = await uploadPodImage(file);
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { podImageUrl },
      select: { id: true, orderRef: true, status: true, podImageUrl: true, updatedAt: true }
    });

    response.status(201).json({ data: updatedDelivery, requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};