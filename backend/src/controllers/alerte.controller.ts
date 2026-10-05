import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateAlerts } from '../services/alert.service';
import { notifyShortfall, notifyExpertiseExpiring } from '../services/notification.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// Comparaison a temps constant : un !== sur la chaine complete laisse
// fuir le secret par mesure du temps de reponse.
function secretCronValide(entete?: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn(
      'CRON_SECRET absent : generation d alertes refusee. Sans cette variable '
      + 'le cron echoue chaque nuit et les alertes ne sont jamais rafraichies.',
    );
    return false;
  }
  const attendu = Buffer.from(`Bearer ${secret}`);
  const recu = Buffer.from(entete ?? '');
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);
}

// Appele par le cron quotidien. En serverless il n'y a pas de process long :
// le setInterval de 24h place dans le callback de app.listen ne s'executait
// jamais, donc les alertes ne se generaient plus du tout.
export async function genererAlertes(req: Request, res: Response): Promise<void> {
  // Fermeture par defaut : sans secret configure, l'endpoint reste clos
  // plutot que de laisser n'importe qui declencher la generation.
  if (!secretCronValide(req.headers.authorization)) {
    res.status(401).json({ error: 'Non autorisé' });
    return;
  }

  try {
    const alertes = await generateAlerts();
    const aNotifier = Array.isArray(alertes) ? alertes : [];
    let notifiees = 0;

    // generateAlerts ne fait qu'ecrire en base : sans cette boucle, les
    // courriels de shortfall et d'expertise ne partent plus.
    for (const { type, hypotheque } of aNotifier) {
      try {
        if (type === 'SHORTFALL') {
          await notifyShortfall(hypotheque);
          notifiees += 1;
        } else if (type === 'EXPERTISE_BIENTOT_EXPIREE') {
          await notifyExpertiseExpiring(hypotheque);
          notifiees += 1;
        }
      } catch (err) {
        logger.error('Notification post-alerte echouee:', err);
      }
    }

    logger.info(
      `Generation alertes par cron : ${aNotifier.length} alerte(s), `
      + `${notifiees} notification(s) envoyee(s)`,
    );
    res.json({ generees: aNotifier.length, notifiees });
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
