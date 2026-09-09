import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { deliveryIdParamSchema } from '../schemas/driver.schema';
import { deletePodImage, uploadPodImage } from '../services/object-storage.service';

const hasExpectedImageSignature = (buffer: Buffer, mimetype: string): boolean => {
  const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return (mimetype === 'image/jpeg' && jpeg) || (mimetype === 'image/png' && png) || (mimetype === 'image/webp' && webp);
};

export const uploadProofOfDelivery: RequestHandler = async (request, response, next) => {
  try {
    const { deliveryId } = deliveryIdParamSchema.parse(request.params);
    const driverId = request.driverId;
    const file = request.file;

    if (!file) {
      throw new AppError(400, 'POD_IMAGE_REQUIRED', 'An image file is required.');
    }
    if (!hasExpectedImageSignature(file.buffer, file.mimetype)) {
      throw new AppError(400, 'INVALID_POD_IMAGE', 'The uploaded file content is not a supported image.');
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, status: true, assignedDriverId: true, podObjectKey: true }
    });

    if (!delivery) throw new AppError(404, 'DELIVERY_NOT_FOUND', 'The delivery was not found.');
    if (delivery.assignedDriverId !== driverId) throw new AppError(403, 'DRIVER_NOT_ASSIGNED', 'The driver is not assigned to this delivery.');
    if (delivery.status !== 'DELIVERED') throw new AppError(409, 'DELIVERY_NOT_COMPLETE', 'Proof of Delivery can only be uploaded after delivery.');
    if (delivery.podObjectKey) throw new AppError(409, 'POD_ALREADY_EXISTS', 'Proof of Delivery has already been uploaded.');

    const podObjectKey = await uploadPodImage(file);
    let updatedDelivery;
    try {
      const persisted = await prisma.delivery.updateMany({
        where: { id: deliveryId, podObjectKey: null },
        data: { podObjectKey }
      });
      if (persisted.count !== 1) throw new AppError(409, 'POD_ALREADY_EXISTS', 'Proof of Delivery has already been uploaded.');
      updatedDelivery = await prisma.delivery.findUniqueOrThrow({ where: { id: deliveryId }, select: { id: true, orderRef: true, status: true, updatedAt: true } });
    } catch (error) {
      try { await deletePodImage(podObjectKey); } catch { console.error(JSON.stringify({ event: 'pod.cleanup_failed' })); }
      throw error;
    }

    response.status(201).json({ data: updatedDelivery, requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};
