import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../lib/errors';

type DriverClaims = jwt.JwtPayload & { sub: string; role: 'driver' };

export function signDriverToken(driverId: string): string {
  return jwt.sign({ role: 'driver' }, env.DRIVER_JWT_SECRET, {
    subject: driverId,
    expiresIn: env.DRIVER_JWT_TTL as NonNullable<jwt.SignOptions['expiresIn']>
  });
}

export function requireDriverAuth(request: Request, _response: Response, next: NextFunction): void {
  const header = request.header('authorization');
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    next(new AppError(401, 'DRIVER_AUTH_REQUIRED', 'A valid driver session is required.'));
    return;
  }

  try {
    const claims = jwt.verify(token, env.DRIVER_JWT_SECRET) as DriverClaims;
    if (claims.role !== 'driver' || typeof claims.sub !== 'string') throw new Error('Invalid driver claims.');
    request.driverId = claims.sub;
    next();
  } catch {
    next(new AppError(401, 'INVALID_DRIVER_SESSION', 'The driver session is invalid or expired.'));
  }
}