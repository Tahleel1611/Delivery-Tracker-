import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { trackingTokenParamSchema } from '../schemas/tracking.schema';
import { getPublicTracking } from '../services/tracking.service';

export const getTracking: RequestHandler = async (request, response, next) => {
  try {
    const { token } = trackingTokenParamSchema.parse(request.params);
    const tracking = await getPublicTracking(prisma, token);
    response.status(200).json({ data: tracking, requestId: request.requestId });
  } catch (error) {
    next(error);
  }
};
