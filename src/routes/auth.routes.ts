import { Router } from 'express';
import { loginDriver } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginDriver);