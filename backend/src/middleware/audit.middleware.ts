import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// Mapping method → action
const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
  PATCH: 'UPDATE',
};

// Mapping path segment → entite
function pathToEntite(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  const map: Record<string, string> = {
    hypotheques: 'hypotheque',
    prets: 'pret',
    clients: 'client',
    users: 'user',
    assurances: 'assurance',
    mainlevees: 'mainlevee',
    recouvrement: 'recouvrement',
    experts: 'expert',
    notifications: 'notification',
    workflow: 'workflow',
    documents: 'document',
    'exports-planifies': 'export',
  };
  const found = segments.find((s) => map[s]);
  return found ? map[found] : null;
}

export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const action = METHOD_TO_ACTION[req.method];
  if (!action) { next(); return; }

  const entite = pathToEntite(req.path);
  if (!entite) { next(); return; }

  // Log après réponse réussie
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const entiteId = req.params.id || (data?.id ? String(data.id) : undefined);
      prismaAny.auditLog.create({
        data: {
          userId: (req as AuthRequest).user?.id ?? null,
          action,
          entite,
          entiteId: entiteId ?? null,
          ip:
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
            req.socket.remoteAddress ??
            null,
          userAgent: req.headers['user-agent']?.slice(0, 200) ?? null,
        },
      }).catch(() => {}); // fire-and-forget
    }
    return originalJson(data);
  };

  next();
}
