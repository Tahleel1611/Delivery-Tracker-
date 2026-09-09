import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { hashPayload } from '../lib/hash';
import { dispatchWebhookSchema } from '../schemas/webhook.schema';
import { ingestDispatch } from '../services/dispatch.service';

export const ingestDispatchWebhook: RequestHandler = async (request, response, next) => {
  try {
    const payload = dispatchWebhookSchema.parse(request.body);
    const result = await ingestDispatch(prisma, payload, hashPayload(payload));

    response.status(result.duplicate ? 200 : 201).json({
      data: result,
      requestId: request.requestId
    });
  } catch (error) {
    next(error);
  }
};
