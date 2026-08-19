import { Router } from 'express';
import { authenticate, requireLecteur, requireGestionnaire } from '../middleware/auth.middleware';
import { getAll, getById, create, update, getAlertes, getStats, createSinistre, updateSinistre } from '../controllers/assurance.controller';

export const assuranceRouter = Router();
assuranceRouter.use(authenticate);
assuranceRouter.get('/alertes', requireLecteur, getAlertes);
assuranceRouter.get('/stats', requireLecteur, getStats);
assuranceRouter.get('/', requireLecteur, getAll);
assuranceRouter.get('/:id', requireLecteur, getById);
assuranceRouter.post('/', requireGestionnaire, create);
assuranceRouter.put('/:id', requireGestionnaire, update);
assuranceRouter.post('/:id/sinistres', requireGestionnaire, createSinistre);
assuranceRouter.put('/:assId/sinistres/:sinId', requireGestionnaire, updateSinistre);
