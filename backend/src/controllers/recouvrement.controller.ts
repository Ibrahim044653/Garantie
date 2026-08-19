import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── GET /api/recouvrement ────────────────────────────────────────────────────
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const statut = req.query.statut as string | undefined;

    const where: Record<string, any> = {};
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      prismaAny.dossierRecouvrement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pret: {
            include: {
              client: { select: { nom: true, codeClient: true } },
            },
            select: { numeroPret: true, client: true },
          },
          planApurement: {
            include: { echeances: true },
          },
          createdBy: { select: { nom: true, prenom: true } },
        },
      }),
      prismaAny.dossierRecouvrement.count({ where }),
    ]);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error('recouvrement.getAll error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des dossiers de recouvrement' });
  }
}

// ─── GET /api/recouvrement/:id ────────────────────────────────────────────────
export async function getById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    const dossier = await prismaAny.dossierRecouvrement.findUnique({
      where: { id },
      include: {
        pret: {
          include: { client: true },
        },
        planApurement: {
          include: { echeances: { orderBy: { numeroEcheance: 'asc' } } },
        },
        createdBy: { select: { id: true, nom: true, prenom: true, role: true } },
      },
    });

    if (!dossier) {
      res.status(404).json({ error: 'Dossier de recouvrement introuvable' });
      return;
    }

    res.json(dossier);
  } catch (err) {
    logger.error('recouvrement.getById error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du dossier' });
  }
}

// ─── POST /api/recouvrement ───────────────────────────────────────────────────
export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { pretId, montantDu, montantPenalites, observations } = req.body;

    if (!pretId || montantDu === undefined) {
      res.status(400).json({ error: 'pretId et montantDu sont requis' });
      return;
    }

    // Vérifier que le prêt existe
    const pret = await prisma.pret.findUnique({ where: { id: Number(pretId) } });
    if (!pret) {
      res.status(404).json({ error: 'Prêt introuvable' });
      return;
    }

    // Vérifier qu'il n'y a pas déjà un dossier
    const existant = await prismaAny.dossierRecouvrement.findUnique({ where: { pretId: Number(pretId) } });
    if (existant) {
      res.status(409).json({ error: 'Un dossier de recouvrement existe déjà pour ce prêt' });
      return;
    }

    const dossier = await prismaAny.dossierRecouvrement.create({
      data: {
        pretId: Number(pretId),
        montantDu: Number(montantDu),
        montantPenalites: montantPenalites ? Number(montantPenalites) : 0,
        observations: observations ?? null,
        statut: 'PRE_CONTENTIEUX',
        createdById: req.user!.id,
      },
    });

    res.status(201).json(dossier);
  } catch (err) {
    logger.error('recouvrement.create error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du dossier de recouvrement' });
  }
}

// ─── PUT /api/recouvrement/:id/statut ────────────────────────────────────────
export async function updateStatut(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { statut, observations } = req.body;

    if (!statut) {
      res.status(400).json({ error: 'statut est requis' });
      return;
    }

    const existing = await prismaAny.dossierRecouvrement.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Dossier de recouvrement introuvable' });
      return;
    }

    const updateData: Record<string, any> = { statut };
    if (observations !== undefined) updateData.observations = observations;

    const dossier = await prismaAny.dossierRecouvrement.update({
      where: { id },
      data: updateData,
    });

    res.json(dossier);
  } catch (err) {
    logger.error('recouvrement.updateStatut error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
}

// ─── POST /api/recouvrement/:id/plan ─────────────────────────────────────────
export async function createPlanApurement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { dateDebut, montantTotal, nombreEcheances, periodeEcheance, tauxPenalite } = req.body;

    if (!dateDebut || !montantTotal || !nombreEcheances || !periodeEcheance) {
      res.status(400).json({ error: 'dateDebut, montantTotal, nombreEcheances et periodeEcheance sont requis' });
      return;
    }

    const dossier = await prismaAny.dossierRecouvrement.findUnique({ where: { id } });
    if (!dossier) {
      res.status(404).json({ error: 'Dossier de recouvrement introuvable' });
      return;
    }

    // Supprimer l'ancien plan s'il existe (cascade supprime les écheances)
    const ancienPlan = await prismaAny.planApurement.findUnique({ where: { dossierId: id } });
    if (ancienPlan) {
      await prismaAny.planApurement.delete({ where: { id: ancienPlan.id } });
    }

    // Calculer les mois par période
    const monthsMap: Record<string, number> = {
      MENSUEL: 1,
      TRIMESTRIEL: 3,
      SEMESTRIEL: 6,
    };
    const intervalMois = monthsMap[periodeEcheance] ?? 1;
    const montantParEcheance = Number(montantTotal) / Number(nombreEcheances);

    // Générer les écheances
    const echeances: Array<{
      numeroEcheance: number;
      dateEcheance: Date;
      montant: number;
      statut: string;
    }> = [];

    const debut = new Date(dateDebut);
    for (let i = 1; i <= Number(nombreEcheances); i++) {
      const date = new Date(debut);
      date.setMonth(date.getMonth() + (i - 1) * intervalMois);
      echeances.push({
        numeroEcheance: i,
        dateEcheance: date,
        montant: parseFloat(montantParEcheance.toFixed(2)),
        statut: 'EN_ATTENTE',
      });
    }

    const plan = await prismaAny.planApurement.create({
      data: {
        dossierId: id,
        dateDebut: new Date(dateDebut),
        montantTotal: Number(montantTotal),
        nombreEcheances: Number(nombreEcheances),
        periodeEcheance,
        tauxPenalite: tauxPenalite ? Number(tauxPenalite) : 0,
        echeances: { create: echeances },
      },
      include: {
        echeances: { orderBy: { numeroEcheance: 'asc' } },
      },
    });

    res.status(201).json(plan);
  } catch (err) {
    logger.error('recouvrement.createPlanApurement error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du plan d\'apurement' });
  }
}

// ─── POST /api/recouvrement/echeances/:echeanceId/paiement ───────────────────
export async function enregistrerPaiement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const echeanceId = parseInt(req.params.echeanceId);
    const { montantPaye, datePaiement } = req.body;

    if (montantPaye === undefined || !datePaiement) {
      res.status(400).json({ error: 'montantPaye et datePaiement sont requis' });
      return;
    }

    const echeance = await prismaAny.echeanceApurement.findUnique({ where: { id: echeanceId } });
    if (!echeance) {
      res.status(404).json({ error: 'Échéance introuvable' });
      return;
    }

    const montantPayeNum = Number(montantPaye);
    const montantEcheance = Number(echeance.montant);
    const statut = montantPayeNum >= montantEcheance ? 'PAYE' : 'PARTIEL';

    const updated = await prismaAny.echeanceApurement.update({
      where: { id: echeanceId },
      data: {
        montantPaye: montantPayeNum,
        datePaiement: new Date(datePaiement),
        statut,
      },
    });

    res.json(updated);
  } catch (err) {
    logger.error('recouvrement.enregistrerPaiement error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement' });
  }
}

// ─── GET /api/recouvrement/stats ──────────────────────────────────────────────
export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [totalDossiers, parStatutRaw, montantDuAgg] = await Promise.all([
      prismaAny.dossierRecouvrement.count(),
      prismaAny.dossierRecouvrement.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),
      prismaAny.dossierRecouvrement.aggregate({
        _sum: { montantDu: true },
      }),
    ]);

    const parStatut: Record<string, number> = {
      PRE_CONTENTIEUX: 0,
      CONTENTIEUX: 0,
      JUDICIAIRE: 0,
      CLOTURE: 0,
    };
    for (const row of parStatutRaw) {
      parStatut[row.statut] = row._count.id;
    }

    const montantDuTotal = Number(montantDuAgg._sum?.montantDu ?? 0);

    // Taux de recouvrement : montant payé / montant dû total
    const montantPayeAgg = await prismaAny.echeanceApurement.aggregate({
      _sum: { montantPaye: true },
      where: { statut: { in: ['PAYE', 'PARTIEL'] } },
    });
    const montantPaye = Number(montantPayeAgg._sum?.montantPaye ?? 0);
    const tauxRecouvrement = montantDuTotal > 0 ? parseFloat(((montantPaye / montantDuTotal) * 100).toFixed(2)) : 0;

    res.json({
      totalDossiers,
      parStatut,
      montantDuTotal,
      tauxRecouvrement,
    });
  } catch (err) {
    logger.error('recouvrement.getStats error:', err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques de recouvrement' });
  }
}
