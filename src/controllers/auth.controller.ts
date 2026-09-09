import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { driverLoginSchema, refreshDriverSessionSchema } from '../schemas/auth.schema';
import { loginWithPassword, rotateDriverSession } from '../services/auth.service';

export const loginDriver: RequestHandler = async (request, response, next) => {
  try {
    const { username, password } = driverLoginSchema.parse(request.body);
    response.status(200).json({ data: await loginWithPassword(prisma, username, password), requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};

export const refreshDriverSession: RequestHandler = async (request, response, next) => {
  try {
    const { refreshToken } = refreshDriverSessionSchema.parse(request.body);
    response.status(200).json({ data: await rotateDriverSession(prisma, refreshToken), requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};
