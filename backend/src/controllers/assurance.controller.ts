import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

function computeJoursRestants(dateFin: Date): number {
  const now = new Date();
  const diff = new Date(dateFin).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── GET /api/assurances ──────────────────────────────────────────────────────
export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { statut, typeAssurance, pretId, clientId, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (statut) where.statut = statut;
    if (typeAssurance) where.typeAssurance = typeAssurance;
    if (pretId) where.pretId = parseInt(pretId as string);
    if (clientId) where.clientId = parseInt(clientId as string);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [total, assurances] = await Promise.all([
      prismaAny.assurance.count({ where }),
      prismaAny.assurance.findMany({
        where,
        skip,
        take,
        orderBy: { dateFin: 'asc' },
        include: {
          client: { select: { nom: true, codeClient: true } },
          pret: { select: { numeroPret: true } },
          _count: { select: { sinistres: true } },
        },
      }),
    ]);

    const data = assurances.map((a: any) => {
      const joursRestants = computeJoursRestants(a.dateFin);
      return {
        ...a,
        joursRestants,
        alerteExpiration: joursRestants < 60,
        sinistresCount: a._count.sinistres,
        _count: undefined,
      };
    });

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    logger.error('Assurance getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/assurances/:id ──────────────────────────────────────────────────
export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const assurance = await prismaAny.assurance.findUnique({
      where: { id },
      include: {
        client: true,
        pret: true,
        hypotheque: true,
        sinistres: { orderBy: { dateDeclaration: 'desc' } },
      },
    });

    if (!assurance) {
      res.status(404).json({ error: 'Assurance not found' });
      return;
    }

    res.json({
      ...assurance,
      joursRestants: computeJoursRestants(assurance.dateFin),
      alerteExpiration: computeJoursRestants(assurance.dateFin) < 60,
    });
  } catch (err) {
    logger.error('Assurance getById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/assurances ─────────────────────────────────────────────────────
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      numeroPolice, compagnie, typeAssurance, pretId, clientId, hypothequeId,
      montantAssure, primeMensuelle, primeAnnuelle, dateDebut, dateFin,
      statut, beneficiaire, notes,
    } = req.body;

    // Validations
    if (!montantAssure || Number(montantAssure) <= 0) {
      res.status(400).json({ error: 'montantAssure must be > 0' });
      return;
    }
    if (new Date(dateFin) <= new Date(dateDebut)) {
      res.status(400).json({ error: 'dateFin must be after dateDebut' });
      return;
    }

    // Check unique numeroPolice
    const existing = await prismaAny.assurance.findUnique({ where: { numeroPolice } });
    if (existing) {
      res.status(409).json({ error: 'numeroPolice already exists' });
      return;
    }

    // Auto-compute statut if expired
    const now = new Date();
    let computedStatut = statut || 'ACTIVE';
    if (new Date(dateFin) < now) {
      computedStatut = 'EXPIREE';
    }

    const assurance = await prismaAny.assurance.create({
      data: {
        numeroPolice,
        compagnie,
        typeAssurance,
        pretId: pretId ? parseInt(pretId) : null,
        clientId: clientId ? parseInt(clientId) : null,
        hypothequeId: hypothequeId ? parseInt(hypothequeId) : null,
        montantAssure,
        primeMensuelle: primeMensuelle || null,
        primeAnnuelle: primeAnnuelle || null,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        statut: computedStatut,
        beneficiaire: beneficiaire || null,
        notes: notes || null,
      },
    });

    res.status(201).json(assurance);
  } catch (err) {
    logger.error('Assurance create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/assurances/:id ──────────────────────────────────────────────────
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prismaAny.assurance.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Assurance not found' });
      return;
    }

    const {
      compagnie, typeAssurance, montantAssure, primeMensuelle, primeAnnuelle,
      dateFin, statut, beneficiaire, notes,
    } = req.body;

    const assurance = await prismaAny.assurance.update({
      where: { id },
      data: {
        ...(compagnie !== undefined && { compagnie }),
        ...(typeAssurance !== undefined && { typeAssurance }),
        ...(montantAssure !== undefined && { montantAssure }),
        ...(primeMensuelle !== undefined && { primeMensuelle }),
        ...(primeAnnuelle !== undefined && { primeAnnuelle }),
        ...(dateFin !== undefined && { dateFin: new Date(dateFin) }),
        ...(statut !== undefined && { statut }),
        ...(beneficiaire !== undefined && { beneficiaire }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(assurance);
  } catch (err) {
    logger.error('Assurance update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/assurances/alertes ──────────────────────────────────────────────
export const getAlertes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const assurances = await prismaAny.assurance.findMany({
      where: {
        statut: 'ACTIVE',
        dateFin: { lt: in60Days },
      },
      orderBy: { dateFin: 'asc' },
      include: {
        client: { select: { nom: true } },
        pret: { select: { numeroPret: true } },
      },
    });

    const data = assurances.map((a: any) => {
      const joursRestants = computeJoursRestants(a.dateFin);
      const severite = joursRestants < 7 ? 'CRITIQUE' : joursRestants < 30 ? 'ELEVEE' : 'MOYENNE';
      return {
        id: a.id,
        numeroPolice: a.numeroPolice,
        compagnie: a.compagnie,
        typeAssurance: a.typeAssurance,
        nomClient: a.client?.nom || null,
        numeroPret: a.pret?.numeroPret || null,
        dateFin: a.dateFin,
        joursRestants,
        severite,
      };
    });

    res.json(data);
  } catch (err) {
    logger.error('Assurance getAlertes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/assurances/stats ────────────────────────────────────────────────
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const [total, byStatutRaw, expirantBientot, montantTotalRaw, primesTotalesRaw] = await Promise.all([
      prismaAny.assurance.count(),
      prismaAny.assurance.groupBy({ by: ['statut'], _count: { id: true } }),
      prismaAny.assurance.count({ where: { statut: 'ACTIVE', dateFin: { lt: in60Days } } }),
      prismaAny.assurance.aggregate({ _sum: { montantAssure: true } }),
      prismaAny.assurance.aggregate({ _sum: { primeMensuelle: true }, where: { statut: 'ACTIVE' } }),
    ]);

    const byStatut: Record<string, number> = {};
    for (const row of byStatutRaw) {
      byStatut[row.statut] = row._count.id;
    }

    res.json({
      total,
      byStatut,
      expirantBientot,
      montantAssureTotalFCFA: montantTotalRaw._sum.montantAssure || 0,
      primesTotalesMois: primesTotalesRaw._sum.primeMensuelle || 0,
    });
  } catch (err) {
    logger.error('Assurance getStats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/assurances/:id/sinistres ───────────────────────────────────────
export const createSinistre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assuranceId = parseInt(req.params.id);
    const assurance = await prismaAny.assurance.findUnique({ where: { id: assuranceId } });
    if (!assurance) {
      res.status(404).json({ error: 'Assurance not found' });
      return;
    }

    const { dateDeclaration, dateSinistre, montantDeclare, description } = req.body;

    const sinistre = await prismaAny.sinistre.create({
      data: {
        assuranceId,
        dateDeclaration: new Date(dateDeclaration),
        dateSinistre: dateSinistre ? new Date(dateSinistre) : null,
        montantDeclare,
        description: description || null,
        statut: 'DECLARE',
      },
    });

    res.status(201).json(sinistre);
  } catch (err) {
    logger.error('Assurance createSinistre error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/assurances/:assId/sinistres/:sinId ──────────────────────────────
export const updateSinistre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assuranceId = parseInt(req.params.assId);
    const sinId = parseInt(req.params.sinId);

    const sinistre = await prismaAny.sinistre.findFirst({
      where: { id: sinId, assuranceId },
    });
    if (!sinistre) {
      res.status(404).json({ error: 'Sinistre not found' });
      return;
    }

    const { statut, montantRembourse, dateReglement } = req.body;

    const updated = await prismaAny.sinistre.update({
      where: { id: sinId },
      data: {
        ...(statut !== undefined && { statut }),
        ...(montantRembourse !== undefined && { montantRembourse }),
        ...(dateReglement !== undefined && { dateReglement: new Date(dateReglement) }),
      },
    });

    res.json(updated);
  } catch (err) {
    logger.error('Assurance updateSinistre error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
