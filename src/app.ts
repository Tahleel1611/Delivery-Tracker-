import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errors';
import { requestId } from './middleware/request-id';
import { authRouter } from './routes/auth.routes';
import { deliveryRouter } from './routes/delivery.routes';
import { driverRouter } from './routes/driver.routes';
import { trackingRouter } from './routes/tracking.routes';
import { webhookRouter } from './routes/webhook.routes';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }));
app.use(express.json({ limit: '256kb' }));
app.use(requestId);

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/drivers', authRouter);
app.use('/api/v1/drivers', driverRouter);
app.use('/api/v1/deliveries', deliveryRouter);
app.use('/api/v1/tracking', trackingRouter);
app.use(notFound);
app.use(errorHandler);
