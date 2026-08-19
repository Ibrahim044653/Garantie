import { Router } from 'express';
import { authenticate, requireLecteur } from '../middleware/auth.middleware';
import { getScoring, getStressTest } from '../controllers/scoring.controller';

export const scoringRouter = Router();
scoringRouter.use(authenticate);
scoringRouter.get('/', requireLecteur, getScoring);
scoringRouter.get('/stress', requireLecteur, getStressTest);
