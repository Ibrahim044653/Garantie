import { Router } from 'express';
import { authenticate, requireLecteur } from '../middleware/auth.middleware';
import { getProvisions, exportProvisions } from '../controllers/provision.controller';

export const provisionRouter = Router();
provisionRouter.use(authenticate);
provisionRouter.get('/', requireLecteur, getProvisions);
provisionRouter.get('/export', requireLecteur, exportProvisions);
