import { Router } from 'express';
import { authenticate, requireLecteur } from '../middleware/auth.middleware';
import { getOverview, getComparaisonPeriodes, getKPIsByRole } from '../controllers/bi.controller';

export const biRouter = Router();
biRouter.use(authenticate);
biRouter.get('/overview', requireLecteur, getOverview);
biRouter.get('/comparaison', requireLecteur, getComparaisonPeriodes);
biRouter.get('/kpis', requireLecteur, getKPIsByRole);
