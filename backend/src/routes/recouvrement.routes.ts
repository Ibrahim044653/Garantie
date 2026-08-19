import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import {
  getAll,
  getById,
  create,
  updateStatut,
  createPlanApurement,
  enregistrerPaiement,
  getStats,
} from '../controllers/recouvrement.controller';

export const recouvrementRouter = Router();

recouvrementRouter.use(authenticate);
recouvrementRouter.use(auditMiddleware);

recouvrementRouter.get('/stats', getStats);
recouvrementRouter.get('/', getAll);
recouvrementRouter.get('/:id', getById);
recouvrementRouter.post('/', create);
recouvrementRouter.put('/:id/statut', updateStatut);
recouvrementRouter.post('/:id/plan', createPlanApurement);
recouvrementRouter.post('/echeances/:echeanceId/paiement', enregistrerPaiement);
