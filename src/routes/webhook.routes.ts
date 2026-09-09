import { Router } from 'express';
import { ingestDispatchWebhook } from '../controllers/webhook.controller';
import { requireLegacyApiKey } from '../middleware/api-key';

export const webhookRouter = Router();

webhookRouter.post('/orders/dispatch', requireLegacyApiKey, ingestDispatchWebhook);
