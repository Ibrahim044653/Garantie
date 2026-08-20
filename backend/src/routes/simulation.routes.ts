import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { stressTest, previsionsProvisions } from '../controllers/simulation.controller';

export const simulationRouter = Router();
simulationRouter.use(authenticate);
simulationRouter.post('/stress-test', stressTest);
simulationRouter.post('/provisions', previsionsProvisions);
