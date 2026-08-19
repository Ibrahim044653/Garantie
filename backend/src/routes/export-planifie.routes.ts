import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getAll, create, toggle, remove } from '../controllers/export-planifie.controller';

export const exportPlanifieRouter = Router();

// Toutes les routes nécessitent une authentification
exportPlanifieRouter.use(authenticate);

// GET /api/exports-planifies
exportPlanifieRouter.get('/', getAll);

// POST /api/exports-planifies
exportPlanifieRouter.post('/', create);

// PUT /api/exports-planifies/:id/toggle
exportPlanifieRouter.put('/:id/toggle', toggle);

// DELETE /api/exports-planifies/:id
exportPlanifieRouter.delete('/:id', remove);
