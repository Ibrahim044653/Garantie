import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getAll, exportCsv } from '../controllers/audit.controller';

export const auditRouter = Router();

// Vérification de rôle : ADMIN ou AUDIT_INTERNE uniquement
function requireAuditRole(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role === 'ADMIN' || role === 'AUDIT_INTERNE') {
    next();
  } else {
    res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
  }
}

auditRouter.use(authenticate);
auditRouter.use(requireAuditRole);

auditRouter.get('/', getAll);
auditRouter.get('/export', exportCsv);
