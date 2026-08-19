import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculerDecotes } from '../services/calcul.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

/**
 * GET /api/hypotheques/:hypothequeId/reevaluations
 * Liste toutes les réévaluations d'une hypothèque, triées par createdAt desc
 */
export const getByHypotheque = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypothequeId = parseInt(req.params.hypothequeId);
    if (isNaN(hypothequeId)) {
      res.status(400).json({ error: 'Invalid hypothequeId' });
      return;
    }

    // Vérifier que l'hypothèque existe
    const hypotheque = await prisma.hypotheque.findUnique({ where: { id: hypothequeId } });
    if (!hypotheque) {
      res.status(404).json({ error: 'Hypothèque non trouvée' });
      return;
    }

    const reevaluations = await prismaAny.reevaluationExpertise.findMany({
      where: { hypothequeId },
      orderBy: { createdAt: 'desc' },
      include: {
        expertAgree: true,
        createdBy: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    res.json({ data: reevaluations, total: reevaluations.length });
  } catch (err) {
    logger.error('getByHypotheque error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/hypotheques/:hypothequeId/reevaluations
 * Créer une réévaluation
 */
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypothequeId = parseInt(req.params.hypothequeId);
    if (isNaN(hypothequeId)) {
      res.status(400).json({ error: 'Invalid hypothequeId' });
      return;
    }

    const { dateExpertise, valeurExpertise, expertNom, motif, expertAgreeId, observations, photoPaths } = req.body;

    // Champs requis
    if (!dateExpertise || !valeurExpertise || !expertNom || !motif) {
      res.status(400).json({ error: 'Champs requis manquants : dateExpertise, valeurExpertise, expertNom, motif' });
      return;
    }

    // Vérifier que l'hypothèque existe
    const hypotheque = await prisma.hypotheque.findUnique({ where: { id: hypothequeId } });
    if (!hypotheque) {
      res.status(404).json({ error: 'Hypothèque non trouvée' });
      return;
    }

    const valeurNum = parseFloat(valeurExpertise);
    if (isNaN(valeurNum) || valeurNum <= 0) {
      res.status(400).json({ error: 'valeurExpertise doit être un nombre positif' });
      return;
    }

    const dateExp = new Date(dateExpertise);
    if (isNaN(dateExp.getTime())) {
      res.status(400).json({ error: 'dateExpertise invalide' });
      return;
    }

    // Vérifier l'expert agréé si fourni
    if (expertAgreeId) {
      const expert = await prismaAny.expertAgree.findUnique({ where: { id: parseInt(expertAgreeId) } });
      if (!expert) {
        res.status(404).json({ error: 'Expert agréé non trouvé' });
        return;
      }
    }

    // Créer la réévaluation
    const reevaluation = await prismaAny.reevaluationExpertise.create({
      data: {
        hypothequeId,
        dateExpertise: dateExp,
        valeurExpertise: valeurNum,
        expertNom,
        motif,
        expertAgreeId: expertAgreeId ? parseInt(expertAgreeId) : null,
        observations: observations || null,
        photoPaths: photoPaths ? JSON.stringify(photoPaths) : null,
        createdById: req.user!.id,
      },
      include: {
        expertAgree: true,
        createdBy: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    // Mettre à jour l'hypothèque avec la nouvelle valeur d'expertise
    await prisma.hypotheque.update({
      where: { id: hypothequeId },
      data: {
        dateExpertise: dateExp,
        valeurExpertiseInitiale: valeurNum,
      },
    });

    // Recalculer les décotes et mettre à jour soldePret si nécessaire
    const hypothequeUpdated = await prisma.hypotheque.findUnique({ where: { id: hypothequeId } });
    if (hypothequeUpdated) {
      const decotes = calculerDecotes(
        valeurNum,
        dateExp,
        hypothequeUpdated.zoneGeographique,
        hypothequeUpdated.statutOccupation,
        Number(hypothequeUpdated.soldePret),
        hypothequeUpdated.natureBien,
      );

      // Si shortfall, on logue l'alerte mais on ne modifie pas soldePret (c'est un solde réel)
      if (decotes.hasShortfall) {
        logger.info(`Hypothèque ${hypothequeId} en shortfall après réévaluation : LTV=${decotes.loanToValue.toFixed(2)}%`);
      }
    }

    // Créer un HistoriqueValeur
    await prismaAny.historiqueValeur.create({
      data: {
        hypothequeId,
        valeur: valeurNum,
        date: dateExp,
        motif: `Réévaluation expertise — ${motif}`,
        createdById: req.user!.id,
      },
    });

    logger.info(`Réévaluation créée pour hypothèque ${hypothequeId} par user ${req.user!.id}`);
    res.status(201).json(reevaluation);
  } catch (err) {
    logger.error('create reevaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/reevaluations/:id
 * Supprimer une réévaluation (admin seulement)
 */
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const existing = await prismaAny.reevaluationExpertise.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Réévaluation non trouvée' });
      return;
    }

    await prismaAny.reevaluationExpertise.delete({ where: { id } });

    logger.info(`Réévaluation ${id} supprimée par admin ${req.user!.id}`);
    res.json({ message: 'Réévaluation supprimée avec succès' });
  } catch (err) {
    logger.error('delete reevaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
