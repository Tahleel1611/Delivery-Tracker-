import { Router } from 'express';
import { getDriverDeliveries, patchDeliveryStatus } from '../controllers/driver.controller';
import { requireDriverAuth } from '../middleware/auth';

export const driverRouter = Router();

driverRouter.get('/:driverId/deliveries', requireDriverAuth, getDriverDeliveries);