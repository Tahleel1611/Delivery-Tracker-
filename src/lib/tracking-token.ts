import { randomBytes } from 'node:crypto';
import { env } from '../config/env';
import { hashSecret } from './secret-hash';

export function createTrackingToken(): string {
  return randomBytes(32).toString('base64url');
}

export function trackingTokenExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + env.TRACKING_TOKEN_TTL_DAYS);
  return expiresAt;
}

export const hashTrackingToken = (token: string): string => hashSecret(token);
