import { Router } from 'express';
import { authenticate, requireAdmin, requireGestionnaire } from '../middleware/auth.middleware';
import { getAll, getById, create, update, remove } from '../controllers/expert.controller';

export const expertRouter = Router();

// Toutes les routes nécessitent une authentification
expertRouter.use(authenticate);

// GET /api/experts
expertRouter.get('/', getAll);

// GET /api/experts/:id
expertRouter.get('/:id', getById);

// POST /api/experts
expertRouter.post('/', requireGestionnaire, create);

// PUT /api/experts/:id
expertRouter.put('/:id', requireGestionnaire, update);

// DELETE /api/experts/:id (admin seulement)
expertRouter.delete('/:id', requireAdmin, remove);
