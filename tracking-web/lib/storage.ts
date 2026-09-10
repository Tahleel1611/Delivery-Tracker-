import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function objectStorageClient() {
  return new S3Client({ endpoint: process.env.OCI_S3_ENDPOINT, region: process.env.OCI_S3_REGION ?? 'us-phoenix-1', forcePathStyle: true, credentials: { accessKeyId: process.env.OCI_S3_ACCESS_KEY ?? '', secretAccessKey: process.env.OCI_S3_SECRET_KEY ?? '' } });
}

export function objectBucket() {
  return process.env.OCI_S3_BUCKET;
}

export async function signedPodViewUrl(objectKey: string) {
  const bucket = objectBucket();
  if (!bucket) return null;
  return getSignedUrl(objectStorageClient(), new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: 300 });
}

export async function podObjectExists(objectKey: string) {
  const bucket = objectBucket();
  if (!bucket) throw new Error('Object storage is not configured.');
  await objectStorageClient().send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export { PutObjectCommand };