import { Router } from 'express';
import { getAll, marquerLu, marquerToutLu, genererAlertes } from '../controllers/alerte.controller';
import { authenticate } from '../middleware/auth.middleware';

export const alerteRouter = Router();

// Declaree avant authenticate : le cron Vercel n'a pas de session
// utilisateur, il s'authentifie avec CRON_SECRET. Le cron emet un GET ;
// le POST reste pour un declenchement manuel.
alerteRouter.get('/generer', genererAlertes);
alerteRouter.post('/generer', genererAlertes);

alerteRouter.use(authenticate);

alerteRouter.get('/', getAll);
alerteRouter.put('/marquer-tout-lu', marquerToutLu);
alerteRouter.put('/:id/lu', marquerLu);
