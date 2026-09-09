import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { hashSecret, verifyPassword } from '../lib/secret-hash';
import { signDriverToken } from '../middleware/auth';

const refreshExpiry = (): Date => {
  const expiry = new Date();
  expiry.setUTCDate(expiry.getUTCDate() + env.DRIVER_REFRESH_TTL_DAYS);
  return expiry;
};

const issueSession = async (database: PrismaClient, driverId: string) => {
  const refreshToken = randomBytes(32).toString('base64url');
  await database.driverSession.create({ data: { driverId, refreshHash: hashSecret(refreshToken), expiresAt: refreshExpiry() } });
  return { accessToken: signDriverToken(driverId), refreshToken };
};

export async function loginWithPassword(database: PrismaClient, username: string, password: string) {
  const credential = await database.driverCredential.findUnique({ where: { username }, include: { driver: { select: { id: true, name: true, status: true } } } });
  const now = new Date();
  if (!credential || credential.driver.status !== 'ACTIVE' || (credential.lockedUntil && credential.lockedUntil > now)) throw new AppError(401, 'DRIVER_LOGIN_FAILED', 'Invalid driver credentials.');
  if (!(await verifyPassword(password, credential.passwordHash))) {
    const failedAttempts = credential.failedAttempts + 1;
    const lockedUntil = failedAttempts >= env.DRIVER_LOGIN_MAX_FAILURES ? new Date(now.getTime() + env.DRIVER_LOGIN_LOCK_MINUTES * 60_000) : null;
    await database.driverCredential.update({ where: { id: credential.id }, data: { failedAttempts, lockedUntil } });
    throw new AppError(401, 'DRIVER_LOGIN_FAILED', 'Invalid driver credentials.');
  }
  await database.driverCredential.update({ where: { id: credential.id }, data: { failedAttempts: 0, lockedUntil: null } });
  return { driver: credential.driver, ...(await issueSession(database, credential.driver.id)) };
}

export async function rotateDriverSession(database: PrismaClient, rawRefreshToken: string) {
  const session = await database.driverSession.findUnique({ where: { refreshHash: hashSecret(rawRefreshToken) }, include: { driver: { select: { id: true, name: true, status: true } } } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.driver.status !== 'ACTIVE') throw new AppError(401, 'INVALID_DRIVER_SESSION', 'The driver session is invalid or expired.');
  await database.driverSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return { driver: session.driver, ...(await issueSession(database, session.driver.id)) };
}
