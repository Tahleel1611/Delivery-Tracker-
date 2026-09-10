'use server';

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeliveryStatus, Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { getAuthorizedUser, type ActionResult } from '../../lib/authorization';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const maxFileSize = Number(process.env.POD_MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024);

function storageClient() {
  return new S3Client({
    endpoint: process.env.OCI_S3_ENDPOINT,
    region: process.env.OCI_S3_REGION ?? 'us-phoenix-1',
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.OCI_S3_ACCESS_KEY ?? '', secretAccessKey: process.env.OCI_S3_SECRET_KEY ?? '' }
  });
}

export async function getPodUploadUrlAction(deliveryId: string, fileMetadata: { contentType: string; size: number }): Promise<ActionResult<{ uploadUrl: string; objectKey: string }>> {
  const driver = await getAuthorizedUser(Role.DRIVER);
  if (!driver) return { success: false, error: 'You are not authorized to upload PoD.' };
  if (!allowedTypes.has(fileMetadata.contentType) || fileMetadata.size <= 0 || fileMetadata.size > maxFileSize) return { success: false, error: 'Unsupported or oversized PoD file.' };
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, assignedUserId: driver.id, status: DeliveryStatus.DELIVERED, podObjectKey: null }, select: { id: true } });
  if (!delivery) return { success: false, error: 'Delivery is not eligible for a PoD upload.' };
  const bucket = process.env.OCI_S3_BUCKET;
  if (!bucket || !process.env.OCI_S3_ENDPOINT) return { success: false, error: 'Object storage is not configured.' };
  const extension = fileMetadata.contentType === 'application/pdf' ? 'pdf' : fileMetadata.contentType.endsWith('png') ? 'png' : 'jpg';
  const objectKey = `pod/${delivery.id}/${randomUUID()}.${extension}`;
  const uploadUrl = await getSignedUrl(storageClient(), new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: fileMetadata.contentType, ContentLength: fileMetadata.size }), { expiresIn: 300 });
  return { success: true, data: { uploadUrl, objectKey } };
}

export async function confirmPodUploadAction(deliveryId: string, objectKey: string): Promise<ActionResult<{ id: string }>> {
  const driver = await getAuthorizedUser(Role.DRIVER);
  if (!driver) return { success: false, error: 'You are not authorized to confirm PoD.' };
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, assignedUserId: driver.id, status: DeliveryStatus.DELIVERED, podObjectKey: null }, select: { id: true } });
  if (!delivery || !objectKey.startsWith(`pod/${deliveryId}/`)) return { success: false, error: 'Invalid PoD upload.' };
  const bucket = process.env.OCI_S3_BUCKET;
  if (!bucket) return { success: false, error: 'Object storage is not configured.' };
  try {
    await storageClient().send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    const updated = await prisma.delivery.updateMany({ where: { id: deliveryId, assignedUserId: driver.id, status: DeliveryStatus.DELIVERED, podObjectKey: null }, data: { podObjectKey: objectKey, podUploadedAt: new Date() } });
    return updated.count === 1 ? { success: true, data: { id: deliveryId } } : { success: false, error: 'PoD was already finalized.' };
  } catch {
    return { success: false, error: 'Uploaded PoD could not be found in storage.' };
  }
}