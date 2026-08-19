import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

/**
 * Calcule la date du prochain export selon la fréquence
 */
function calcProchainExport(frequence: string): Date {
  const now = new Date();
  switch (frequence) {
    case 'MENSUEL':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'TRIMESTRIEL':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'SEMESTRIEL':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'ANNUEL':
      now.setMonth(now.getMonth() + 12);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  return now;
}

/**
 * GET /api/exports-planifies
 * Liste des exports planifiés (user voit les siens, admin voit tout)
 */
export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.createdById = req.user!.id;
    }

    const exports = await prismaAny.exportPlanifie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    res.json({ data: exports, total: exports.length });
  } catch (err) {
    logger.error('getAll exportsPlanifies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/exports-planifies
 * Créer un export planifié
 */
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, frequence, destinataires, filtres, actif = true } = req.body;

    if (!type || !frequence || !destinataires) {
      res.status(400).json({ error: 'Champs requis manquants : type, frequence, destinataires' });
      return;
    }

    if (!Array.isArray(destinataires) || destinataires.length === 0) {
      res.status(400).json({ error: 'destinataires doit être un tableau non vide' });
      return;
    }

    const TYPES_VALIDES = ['HYPOTHEQUES', 'PROVISIONS', 'REPORTING_BCEAO', 'SCORING', 'BI'];
    if (!TYPES_VALIDES.includes(type)) {
      res.status(400).json({ error: `type doit être l'un de : ${TYPES_VALIDES.join(', ')}` });
      return;
    }

    const FREQUENCES_VALIDES = ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'];
    if (!FREQUENCES_VALIDES.includes(frequence)) {
      res.status(400).json({ error: `frequence doit être l'une de : ${FREQUENCES_VALIDES.join(', ')}` });
      return;
    }

    const prochainExport = calcProchainExport(frequence);

    const exportPlanifie = await prismaAny.exportPlanifie.create({
      data: {
        type,
        frequence,
        prochainExport,
        destinataires: JSON.stringify(destinataires),
        filtres: filtres ? filtres : null,
        actif: Boolean(actif),
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    logger.info(`Export planifié créé : type=${type}, fréquence=${frequence} par user ${req.user!.id}`);
    res.status(201).json(exportPlanifie);
  } catch (err) {
    logger.error('create exportPlanifie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/exports-planifies/:id/toggle
 * Activer ou désactiver un export planifié
 */
export const toggle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const isAdmin = req.user!.role === 'ADMIN';

    const existing = await prismaAny.exportPlanifie.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Export planifié non trouvé' });
      return;
    }

    // Un non-admin ne peut modifier que ses propres exports
    if (!isAdmin && existing.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const updated = await prismaAny.exportPlanifie.update({
      where: { id },
      data: { actif: !existing.actif },
    });

    logger.info(`Export planifié ${id} ${updated.actif ? 'activé' : 'désactivé'} par user ${req.user!.id}`);
    res.json(updated);
  } catch (err) {
    logger.error('toggle exportPlanifie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/exports-planifies/:id
 * Supprimer un export planifié
 */
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const isAdmin = req.user!.role === 'ADMIN';

    const existing = await prismaAny.exportPlanifie.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Export planifié non trouvé' });
      return;
    }

    // Un non-admin ne peut supprimer que ses propres exports
    if (!isAdmin && existing.createdById !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    await prismaAny.exportPlanifie.delete({ where: { id } });

    logger.info(`Export planifié ${id} supprimé par user ${req.user!.id}`);
    res.json({ message: 'Export planifié supprimé avec succès' });
  } catch (err) {
    logger.error('delete exportPlanifie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
