import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAlerts } from '../services/alert.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// Appele par le cron Vercel. En serverless il n'y a pas de process long :
// le setInterval de 24h place dans le callback de app.listen ne s'execute
// jamais, donc les alertes ne se generaient plus du tout.
export async function genererAlertes(req: Request, res: Response): Promise<void> {
  // Fermeture par defaut : sans secret configure, l'endpoint reste clos
  // plutot que de laisser n'importe qui declencher la generation.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Non autorisé' });
    return;
  }

  try {
    const alertes = await generateAlerts();
    const total = Array.isArray(alertes) ? alertes.length : 0;
    logger.info(`Generation alertes par cron : ${total} alerte(s)`);
    res.json({ generees: total });
  } catch (err) {
    logger.error('Generation alertes par cron echouee:', err);
    res.status(500).json({ error: 'Génération échouée' });
  }
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { type, lu, hypothequeId, page = '1', limit = '50' } = req.query;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (lu !== undefined) where.lu = lu === 'true';
    if (hypothequeId) where.hypothequeId = parseInt(hypothequeId as string);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [alertes, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          hypotheque: {
            select: {
              id: true,
              numeroTitreFoncier: true,
              nomClient: true,
              numeroPret: true,
            },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({
      data: alertes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
}

export async function marquerLu(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const alerte = await prisma.alert.update({
      where: { id },
      data: { lu: true },
    });
    res.json(alerte);
  } catch {
    res.status(404).json({ error: 'Alerte introuvable' });
  }
}

export async function marquerToutLu(req: Request, res: Response): Promise<void> {
  try {
    const { hypothequeId } = req.query;
    const where: Record<string, unknown> = { lu: false };
    if (hypothequeId) where.hypothequeId = parseInt(hypothequeId as string);

    const result = await prisma.alert.updateMany({ where, data: { lu: true } });
    res.json({ updated: result.count });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des alertes' });
  }
}
