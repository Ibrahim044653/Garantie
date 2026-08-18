import { Router } from 'express';
import {
  getStats, getAlertes, getRepartitionZone, getEvolutionVNC, markAlerteLue, markAllAlertesLues,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/stats', getStats);
dashboardRouter.get('/alertes', getAlertes);
dashboardRouter.get('/repartition-zone', getRepartitionZone);
dashboardRouter.get('/evolution-vnc', getEvolutionVNC);
dashboardRouter.put('/alertes/lue-toutes', markAllAlertesLues);
dashboardRouter.put('/alertes/:id/lue', markAlerteLue);
