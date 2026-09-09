import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { AppError } from '../lib/errors';

let client: S3Client | undefined;

function getStorageConfig() {
  const values = [env.OCI_S3_ENDPOINT, env.OCI_S3_NAMESPACE, env.OCI_S3_BUCKET, env.OCI_S3_ACCESS_KEY, env.OCI_S3_SECRET_KEY];
  if (values.some((value) => !value)) {
    throw new AppError(503, 'POD_STORAGE_NOT_CONFIGURED', 'Proof of Delivery storage is not configured.');
  }

  return {
    endpoint: env.OCI_S3_ENDPOINT as string,
    namespace: env.OCI_S3_NAMESPACE as string,
    bucket: env.OCI_S3_BUCKET as string
  };
}

export async function uploadPodImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
  const config = getStorageConfig();
  client ??= new S3Client({
    endpoint: config.endpoint,
    region: env.OCI_S3_REGION,
    forcePathStyle: false,
    credentials: { accessKeyId: env.OCI_S3_ACCESS_KEY as string, secretAccessKey: env.OCI_S3_SECRET_KEY as string }
  });

  const key = `proof-of-delivery/${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentDisposition: 'inline'
  }));

  return key;
}

export async function deletePodImage(key: string): Promise<void> {
  const config = getStorageConfig();
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}
