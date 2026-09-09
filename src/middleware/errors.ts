import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import multer from 'multer';

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'The request payload is invalid.', details: error.flatten() },
      requestId: request.requestId
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: { code: 'INVALID_UPLOAD', message: error.message },
      requestId: request.requestId
    });
    return;
  }

  const appError = error instanceof AppError ? error : undefined;
  const statusCode = appError?.statusCode ?? 500;
  const code = appError?.code ?? 'INTERNAL_SERVER_ERROR';
  const message = appError?.message ?? 'An unexpected error occurred.';

  if (statusCode >= 500) console.error({ requestId: request.requestId, error });
  response.status(statusCode).json({ error: { code, message }, requestId: request.requestId });
};
