import { Router } from 'express';
import { getTracking } from '../controllers/tracking.controller';

export const trackingRouter = Router();

// Deliberately unauthenticated: the response is shaped by getPublicTracking.
trackingRouter.get('/t/:token', getTracking);
