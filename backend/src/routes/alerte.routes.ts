import { Router } from 'express';
import { getAll, marquerLu, marquerToutLu, genererAlertes } from '../controllers/alerte.controller';
import { authenticate } from '../middleware/auth.middleware';

export const alerteRouter = Router();

// Declaree avant authenticate : le cron n'a pas de session utilisateur,
// il s'authentifie avec CRON_SECRET. En GET seulement : c'est ce qu'emet
// le cron, et un POST serait de toute facon rejete par validateCsrf, monte
// globalement en amont des routes.
alerteRouter.get('/generer', genererAlertes);

alerteRouter.use(authenticate);

alerteRouter.get('/', getAll);
alerteRouter.put('/marquer-tout-lu', marquerToutLu);
alerteRouter.put('/:id/lu', marquerLu);
