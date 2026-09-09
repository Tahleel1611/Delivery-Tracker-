import { Router } from 'express';
import { loginDriver, refreshDriverSession } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/login', loginDriver);
authRouter.post('/refresh', refreshDriverSession);
