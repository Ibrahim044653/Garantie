import { Router } from 'express';
import { getConfig, saveConfig, resetConfig } from '../controllers/dashboard-config.controller';
import { authenticate } from '../middleware/auth.middleware';

export const dashboardConfigRouter = Router();

dashboardConfigRouter.use(authenticate);

dashboardConfigRouter.get('/config', getConfig);
dashboardConfigRouter.put('/config', saveConfig);
dashboardConfigRouter.delete('/config', resetConfig);
