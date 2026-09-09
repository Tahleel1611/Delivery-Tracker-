import { Router } from 'express';
import { getDriverDeliveries, patchDeliveryStatus } from '../controllers/driver.controller';
import { requireLegacyApiKey } from '../middleware/api-key';

export const driverRouter = Router();

driverRouter.get('/:driverId/deliveries', requireLegacyApiKey, getDriverDeliveries);