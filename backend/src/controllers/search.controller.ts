import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── GET /api/search?q=&types=hypotheque,client,pret,document ────────────────
export async function search(req: AuthRequest, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string || '').trim();
    const typesParam = (req.query.types as string || 'hypotheque,client,pret,document');
    const types = typesParam.split(',').map((t) => t.trim());

    if (q.length < 2) {
      res.status(400).json({ error: 'La requête doit contenir au moins 2 caractères' });
      return;
    }

    const tasks: Array<Promise<any[]>> = [];
    const taskKeys: string[] = [];

    if (types.includes('hypotheque')) {
      taskKeys.push('hypotheques');
      tasks.push(
        prisma.hypotheque.findMany({
          where: {
            OR: [
              { nomClient: { contains: q, mode: 'insensitive' } },
              { numeroPret: { contains: q, mode: 'insensitive' } },
              { numeroTitreFoncier: { contains: q, mode: 'insensitive' } },
              { codeClient: { contains: q, mode: 'insensitive' } },
              { ville: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: {
            id: true,
            nomClient: true,
            numeroPret: true,
            numeroTitreFoncier: true,
            codeClient: true,
            ville: true,
            natureBien: true,
            valeurExpertiseInitiale: true,
          },
        })
      );
    }

    if (types.includes('client')) {
      taskKeys.push('clients');
      tasks.push(
        prisma.client.findMany({
          where: {
            OR: [
              { nom: { contains: q, mode: 'insensitive' } },
              { prenom: { contains: q, mode: 'insensitive' } },
              { raisonSociale: { contains: q, mode: 'insensitive' } },
              { codeClient: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: {
            id: true,
            codeClient: true,
            nom: true,
            prenom: true,
            raisonSociale: true,
            typeClient: true,
            statut: true,
            telephone: true,
            email: true,
          },
        })
      );
    }

    if (types.includes('pret')) {
      taskKeys.push('prets');
      tasks.push(
        prisma.pret.findMany({
          where: {
            OR: [
              { numeroPret: { contains: q, mode: 'insensitive' } },
              { client: { nom: { contains: q, mode: 'insensitive' } } },
              { client: { codeClient: { contains: q, mode: 'insensitive' } } },
            ],
          },
          take: 5,
          select: {
            id: true,
            numeroPret: true,
            montantInitial: true,
            statut: true,
            dateDebut: true,
            dateFin: true,
            client: { select: { nom: true, prenom: true, codeClient: true } },
          },
        })
      );
    }

    if (types.includes('document')) {
      taskKeys.push('documents');
      tasks.push(
        prismaAny.document.findMany({
          where: {
            OR: [
              { titre: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: {
            id: true,
            titre: true,
            type: true,
            description: true,
            statut: true,
            createdAt: true,
            hypotheque: {
              select: { nomClient: true, numeroPret: true },
            },
          },
        })
      );
    }

    const results = await Promise.all(tasks);

    const output: Record<string, any[]> = {
      hypotheques: [],
      clients: [],
      prets: [],
      documents: [],
    };
    let total = 0;
    taskKeys.forEach((key, idx) => {
      output[key] = results[idx];
      total += results[idx].length;
    });

    // Audit log (fire-and-forget)
    prismaAny.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        action: 'SEARCH',
        entite: 'global',
        entiteId: null,
        details: JSON.stringify({ query: q, types }),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 200) ?? null,
      },
    }).catch(() => {});

    res.json({ ...output, total });
  } catch (err) {
    logger.error('search.search error:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
}
