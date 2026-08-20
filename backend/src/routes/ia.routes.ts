import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { scoring, anomalies, reclassification } from '../controllers/ia.controller';

export const iaRouter = Router();
iaRouter.use(authenticate);
iaRouter.get('/scoring', scoring);
iaRouter.get('/anomalies', anomalies);
iaRouter.get('/reclassification', reclassification);
