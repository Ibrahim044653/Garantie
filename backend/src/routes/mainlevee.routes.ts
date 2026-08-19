import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import {
  getAll,
  getById,
  create,
  updateStatut,
  addDocument,
  generateActe,
} from '../controllers/mainlevee.controller';

export const mainleveeRouter = Router();

mainleveeRouter.use(authenticate);
mainleveeRouter.use(auditMiddleware);

mainleveeRouter.get('/', getAll);
mainleveeRouter.get('/:id/acte-pdf', generateActe);
mainleveeRouter.get('/:id', getById);
mainleveeRouter.post('/', create);
mainleveeRouter.put('/:id/statut', updateStatut);
mainleveeRouter.put('/:id/documents', addDocument);
