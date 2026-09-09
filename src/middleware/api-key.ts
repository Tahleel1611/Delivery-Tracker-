import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../lib/errors';

export function requireLegacyApiKey(request: Request, _response: Response, next: NextFunction): void {
  const provided = request.header('x-api-key');
  const expected = Buffer.from(env.LEGACY_WEBHOOK_API_KEY);
  const actual = Buffer.from(provided ?? '');

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    next(new AppError(401, 'INVALID_API_KEY', 'A valid API key is required.'));
    return;
  }

  next();
}
