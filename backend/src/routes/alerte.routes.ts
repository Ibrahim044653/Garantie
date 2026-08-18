import { Router } from 'express';
import { getAll, marquerLu, marquerToutLu } from '../controllers/alerte.controller';
import { authenticate } from '../middleware/auth.middleware';

export const alerteRouter = Router();

alerteRouter.use(authenticate);

alerteRouter.get('/', getAll);
alerteRouter.put('/marquer-tout-lu', marquerToutLu);
alerteRouter.put('/:id/lu', marquerLu);
