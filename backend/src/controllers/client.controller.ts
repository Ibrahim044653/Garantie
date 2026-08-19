import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// Génère un codeClient unique : CLI + année + séquence paddée (ex: CLI20260001)
async function generateCodeClient(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLI${year}`;
  const count = await prisma.client.count({
    where: { codeClient: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

// GET /api/clients — Liste paginée avec filtres
export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { statut, typeClient, search, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (statut) where.statut = statut;
    if (typeClient) where.typeClient = typeClient;
    if (search) {
      where.OR = [
        { nom: { contains: search as string, mode: 'insensitive' } },
        { prenom: { contains: search as string, mode: 'insensitive' } },
        { raisonSociale: { contains: search as string, mode: 'insensitive' } },
        { codeClient: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { prets: true, hypotheques: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    logger.error('client.getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/clients/:id — Détail avec prêts, hypothèques et statistiques
export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        prets: { orderBy: { createdAt: 'desc' } },
        hypotheques: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Statistiques calculées
    const pretsActifs = client.prets.filter(
      (p) => p.statut === 'ACTIF' || p.statut === 'EN_DEFAUT',
    );
    const totalEncours = pretsActifs.reduce((sum, p) => sum + Number(p.montantRestant), 0);
    const nombreGaranties = client.hypotheques.length;

    res.json({
      ...client,
      prets: client.prets.map((p) => ({
        ...p,
        montantInitial: Number(p.montantInitial),
        montantRestant: Number(p.montantRestant),
        tauxInteret: Number(p.tauxInteret),
      })),
      hypotheques: client.hypotheques.map((h) => ({
        ...h,
        valeurExpertiseInitiale: Number(h.valeurExpertiseInitiale),
        montantInscription: Number(h.montantInscription),
        soldePret: Number(h.soldePret),
      })),
      statistiques: {
        totalEncours,
        nombreGaranties,
        nombrePrets: client.prets.length,
        nombrePretsActifs: pretsActifs.length,
      },
    });
  } catch (err) {
    logger.error('client.getById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/clients — Création client
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      codeClient: codeClientInput,
      typeClient,
      nom,
      prenom,
      raisonSociale,
      telephone,
      email,
      adresse,
      ville,
      dateNaissance,
      numeroIdentite,
      statut,
    } = req.body;

    const codeClient = codeClientInput || (await generateCodeClient());

    const client = await prisma.client.create({
      data: {
        codeClient,
        typeClient: typeClient || 'PARTICULIER',
        nom,
        prenom: prenom || null,
        raisonSociale: raisonSociale || null,
        telephone: telephone || null,
        email: email || null,
        adresse: adresse || null,
        ville: ville || null,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        numeroIdentite: numeroIdentite || null,
        statut: statut || 'ACTIF',
      },
    });

    logger.info(`Client created: ${client.codeClient} by ${req.user!.email}`);
    res.status(201).json(client);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      res.status(409).json({ error: 'Code client already exists' });
      return;
    }
    logger.error('client.create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/clients/:id — Mise à jour client
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const {
      typeClient,
      nom,
      prenom,
      raisonSociale,
      telephone,
      email,
      adresse,
      ville,
      dateNaissance,
      numeroIdentite,
      statut,
    } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        typeClient: typeClient ?? existing.typeClient,
        nom: nom ?? existing.nom,
        prenom: prenom !== undefined ? (prenom || null) : existing.prenom,
        raisonSociale: raisonSociale !== undefined ? (raisonSociale || null) : existing.raisonSociale,
        telephone: telephone !== undefined ? (telephone || null) : existing.telephone,
        email: email !== undefined ? (email || null) : existing.email,
        adresse: adresse !== undefined ? (adresse || null) : existing.adresse,
        ville: ville !== undefined ? (ville || null) : existing.ville,
        dateNaissance:
          dateNaissance !== undefined
            ? dateNaissance ? new Date(dateNaissance) : null
            : existing.dateNaissance,
        numeroIdentite: numeroIdentite !== undefined ? (numeroIdentite || null) : existing.numeroIdentite,
        statut: statut ?? existing.statut,
      },
    });

    logger.info(`Client updated: ${client.codeClient} by ${req.user!.email}`);
    res.json(client);
  } catch (err) {
    logger.error('client.update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/clients/:id — Suppression (bloquée si prêts actifs)
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.client.findUnique({
      where: { id },
      include: {
        prets: {
          where: { statut: { in: ['ACTIF', 'EN_DEFAUT'] } },
          select: { id: true, numeroPret: true, statut: true },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    if (existing.prets.length > 0) {
      res.status(409).json({
        error: 'Impossible de supprimer un client avec des prêts actifs',
        activeLoans: existing.prets.length,
        loans: existing.prets.map((p) => ({ numeroPret: p.numeroPret, statut: p.statut })),
      });
      return;
    }

    await prisma.client.delete({ where: { id } });
    logger.info(`Client deleted: ${existing.codeClient} by ${req.user!.email}`);
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    logger.error('client.remove error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/clients/stats — Statistiques globales CRM
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, parType, parStatut] = await Promise.all([
      prisma.client.count(),
      prisma.client.groupBy({
        by: ['typeClient'],
        _count: { id: true },
      }),
      prisma.client.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),
    ]);

    res.json({
      total,
      parType: parType.reduce(
        (acc, item) => {
          acc[item.typeClient as string] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      parStatut: parStatut.reduce(
        (acc, item) => {
          acc[item.statut as string] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });
  } catch (err) {
    logger.error('client.getStats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
