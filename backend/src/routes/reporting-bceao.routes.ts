import { Router } from 'express';
import { authenticate, requireLecteur } from '../middleware/auth.middleware';
import { getRatios, exportBCEAO } from '../controllers/reporting-bceao.controller';

export const reportingBceaoRouter = Router();
reportingBceaoRouter.use(authenticate);
reportingBceaoRouter.get('/ratios', requireLecteur, getRatios);
reportingBceaoRouter.get('/export', requireLecteur, exportBCEAO);
