import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculerAmortissement } from '../services/amortissement.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convertit les champs Decimal Prisma en number pour le JSON */
function serializePret(pret: Record<string, unknown>): Record<string, unknown> {
  return {
    ...pret,
    montantInitial: pret.montantInitial != null ? Number(pret.montantInitial) : null,
    montantRestant: pret.montantRestant != null ? Number(pret.montantRestant) : null,
    tauxInteret: pret.tauxInteret != null ? Number(pret.tauxInteret) : null,
  };
}

function serializeEcheance(e: Record<string, unknown>): Record<string, unknown> {
  return {
    ...e,
    capitalDu: e.capitalDu != null ? Number(e.capitalDu) : null,
    interetsDus: e.interetsDus != null ? Number(e.interetsDus) : null,
    montantTotal: e.montantTotal != null ? Number(e.montantTotal) : null,
    capitalRembourse: e.capitalRembourse != null ? Number(e.capitalRembourse) : null,
    interetsRembourses: e.interetsRembourses != null ? Number(e.interetsRembourses) : null,
    penalites: e.penalites != null ? Number(e.penalites) : null,
    montantPaye: e.montantPaye != null ? Number(e.montantPaye) : null,
  };
}

// ─── GET /api/prets ──────────────────────────────────────────────────────────

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, statut, search, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (clientId) where.clientId = parseInt(clientId as string);
    if (statut) where.statut = statut;
    if (search) {
      where.OR = [
        { numeroPret: { contains: search as string } },
        { objet: { contains: search as string } },
        { client: { nom: { contains: search as string } } },
        { client: { prenom: { contains: search as string } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [total, prets] = await Promise.all([
      prisma.pret.count({ where }),
      prisma.pret.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, nom: true, prenom: true, email: true } },
          _count: { select: { echeances: true } },
        },
      }),
    ]);

    res.json({
      data: prets.map((p) => serializePret(p as unknown as Record<string, unknown>)),
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    logger.error('pret.getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/prets/stats ────────────────────────────────────────────────────

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [encours, parStatut, impayes] = await Promise.all([
      // Encours total = somme des montants restants des prêts ACTIF
      prisma.pret.aggregate({
        where: { statut: 'ACTIF' },
        _sum: { montantRestant: true },
      }),

      // Nombre de prêts par statut
      prisma.pret.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),

      // Échéances impayées (statut IMPAYE)
      prisma.echeancePret.aggregate({
        where: { statut: 'IMPAYE' },
        _sum: { montantTotal: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      encoursTotalActif: Number(encours._sum.montantRestant ?? 0),
      pretsByStatut: parStatut.map((s) => ({ statut: s.statut, count: s._count.id })),
      impayes: {
        count: impayes._count.id,
        montantTotal: Number(impayes._sum.montantTotal ?? 0),
      },
    });
  } catch (err) {
    logger.error('pret.getStats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/prets/:id ──────────────────────────────────────────────────────

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const pret = await prisma.pret.findUnique({
      where: { id },
      include: {
        client: true,
        hypotheques: true,
        echeances: { orderBy: { numeroEcheance: 'asc' } },
      },
    });

    if (!pret) {
      res.status(404).json({ error: 'Prêt non trouvé' });
      return;
    }

    // Résumé des échéances
    const echeances = pret.echeances;
    const resume = {
      total: echeances.length,
      payees: echeances.filter((e) => e.statut === 'PAYE').length,
      partielles: echeances.filter((e) => e.statut === 'PARTIEL').length,
      impayes: echeances.filter((e) => e.statut === 'IMPAYE').length,
      enAttente: echeances.filter((e) => e.statut === 'EN_ATTENTE').length,
      enRetard: echeances.filter(
        (e) => e.statut === 'EN_ATTENTE' && new Date(e.dateEcheance) < new Date(),
      ).length,
    };

    res.json({
      ...serializePret(pret as unknown as Record<string, unknown>),
      echeances: echeances.map((e) => serializeEcheance(e as unknown as Record<string, unknown>)),
      resumeEcheances: resume,
    });
  } catch (err) {
    logger.error('pret.getById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/prets ─────────────────────────────────────────────────────────

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      clientId,
      numeroPret,
      montantInitial,
      tauxInteret,
      dureeMois,
      typeAmortissement,
      dateDebut,
      objet,
    } = req.body;

    const montant = parseFloat(montantInitial);
    const taux = parseFloat(tauxInteret);
    const duree = parseInt(dureeMois);
    const debut = new Date(dateDebut);

    // Calcul de la date de fin
    const dateFin = new Date(debut);
    dateFin.setMonth(dateFin.getMonth() + duree);

    // Créer le prêt
    const pret = await prisma.pret.create({
      data: {
        clientId: parseInt(clientId),
        numeroPret,
        montantInitial: montant,
        montantRestant: montant,
        tauxInteret: taux,
        dureeMois: duree,
        typeAmortissement,
        dateDebut: debut,
        dateFin,
        statut: 'ACTIF',
        objet: objet || null,
      },
    });

    // Générer les échéances via le service d'amortissement
    const echeancesCalc = calculerAmortissement(montant, taux, duree, typeAmortissement, debut);

    await prisma.echeancePret.createMany({
      data: echeancesCalc.map((e) => ({
        pretId: pret.id,
        numeroEcheance: e.numeroEcheance,
        dateEcheance: e.dateEcheance,
        capitalDu: e.capitalDu,
        interetsDus: e.interetsDus,
        montantTotal: e.montantTotal,
        statut: 'EN_ATTENTE',
      })),
    });

    logger.info(`Prêt créé: ${pret.numeroPret} par ${req.user!.email}`);

    const pretAvecEcheances = await prisma.pret.findUnique({
      where: { id: pret.id },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        echeances: { orderBy: { numeroEcheance: 'asc' } },
      },
    });

    res.status(201).json(serializePret(pretAvecEcheances as unknown as Record<string, unknown>));
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      res.status(409).json({ error: 'Numéro de prêt déjà utilisé' });
      return;
    }
    logger.error('pret.create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/prets/:id ──────────────────────────────────────────────────────

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.pret.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Prêt non trouvé' });
      return;
    }

    const { statut, objet } = req.body;

    const pret = await prisma.pret.update({
      where: { id },
      data: {
        statut: statut ?? existing.statut,
        objet: objet !== undefined ? objet || null : existing.objet,
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
      },
    });

    logger.info(`Prêt mis à jour: ${pret.numeroPret} par ${req.user!.email}`);
    res.json(serializePret(pret as unknown as Record<string, unknown>));
  } catch (err) {
    logger.error('pret.update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/prets/:id/paiements ──────────────────────────────────────────

export const enregistrerPaiement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pretId = parseInt(req.params.id);
    const { echeanceId, montantPaye, datePaiement, commentaire } = req.body;

    const pret = await prisma.pret.findUnique({ where: { id: pretId } });
    if (!pret) {
      res.status(404).json({ error: 'Prêt non trouvé' });
      return;
    }

    const echeance = await prisma.echeancePret.findFirst({
      where: { id: parseInt(echeanceId), pretId },
    });

    if (!echeance) {
      res.status(404).json({ error: 'Échéance non trouvée pour ce prêt' });
      return;
    }

    const montant = parseFloat(montantPaye);
    const montantTotal = Number(echeance.montantTotal);

    // Déterminer le statut selon le montant payé
    let statut: 'PAYE' | 'PARTIEL' = montant >= montantTotal ? 'PAYE' : 'PARTIEL';

    const echeanceMaj = await prisma.echeancePret.update({
      where: { id: echeance.id },
      data: {
        montantPaye: montant,
        datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
        statut,
        commentaire: commentaire || null,
      },
    });

    logger.info(
      `Paiement enregistré: prêt ${pret.numeroPret}, échéance ${echeance.numeroEcheance}, montant ${montant} par ${req.user!.email}`,
    );

    res.json(serializeEcheance(echeanceMaj as unknown as Record<string, unknown>));
  } catch (err) {
    logger.error('pret.enregistrerPaiement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/prets/:id/echeances ───────────────────────────────────────────

export const getEcheances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pretId = parseInt(req.params.id);

    const pret = await prisma.pret.findUnique({ where: { id: pretId } });
    if (!pret) {
      res.status(404).json({ error: 'Prêt non trouvé' });
      return;
    }

    const echeances = await prisma.echeancePret.findMany({
      where: { pretId },
      orderBy: { numeroEcheance: 'asc' },
    });

    res.json(echeances.map((e) => serializeEcheance(e as unknown as Record<string, unknown>)));
  } catch (err) {
    logger.error('pret.getEcheances error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
