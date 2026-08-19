import { Router } from 'express';
import { authenticate, requireAdmin, requireGestionnaire } from '../middleware/auth.middleware';
import { getByHypotheque, create, remove } from '../controllers/reevaluation.controller';

export const reevaluationRouter = Router();

// Toutes les routes nécessitent une authentification
reevaluationRouter.use(authenticate);

// GET /api/hypotheques/:hypothequeId/reevaluations
reevaluationRouter.get('/hypotheques/:hypothequeId/reevaluations', getByHypotheque);

// POST /api/hypotheques/:hypothequeId/reevaluations
reevaluationRouter.post('/hypotheques/:hypothequeId/reevaluations', requireGestionnaire, create);

// DELETE /api/reevaluations/:id (admin seulement)
reevaluationRouter.delete('/reevaluations/:id', requireAdmin, remove);
