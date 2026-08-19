import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

/**
 * GET /api/experts
 * Liste des experts agréés avec filtre statut, search, pagination
 */
export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { statut, search, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { prenom: { contains: search as string } },
        { cabinet: { contains: search as string } },
        { numeroAgrement: { contains: search as string } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [experts, total] = await Promise.all([
      prismaAny.expertAgree.findMany({
        where,
        orderBy: { nom: 'asc' },
        skip,
        take: limitNum,
      }),
      prismaAny.expertAgree.count({ where }),
    ]);

    res.json({
      data: experts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    logger.error('getAll experts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/experts/:id
 * Détail d'un expert avec count des réévaluations
 */
export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const expert = await prismaAny.expertAgree.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reevaluations: true },
        },
      },
    });

    if (!expert) {
      res.status(404).json({ error: 'Expert agréé non trouvé' });
      return;
    }

    res.json(expert);
  } catch (err) {
    logger.error('getById expert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/experts
 * Créer un expert agréé
 */
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nom,
      prenom,
      cabinet,
      telephone,
      email,
      numeroAgrement,
      dateAgrement,
      dateExpiration,
      statut,
      specialites,
    } = req.body;

    if (!nom || !numeroAgrement || !dateAgrement || !statut) {
      res.status(400).json({ error: 'Champs requis manquants : nom, numeroAgrement, dateAgrement, statut' });
      return;
    }

    // Vérifier unicité du numéro d'agrément
    const existing = await prismaAny.expertAgree.findUnique({ where: { numeroAgrement } });
    if (existing) {
      res.status(409).json({ error: 'Un expert avec ce numéro d\'agrément existe déjà' });
      return;
    }

    const dateAgrementParsed = new Date(dateAgrement);
    if (isNaN(dateAgrementParsed.getTime())) {
      res.status(400).json({ error: 'dateAgrement invalide' });
      return;
    }

    let dateExpirationParsed: Date | null = null;
    if (dateExpiration) {
      dateExpirationParsed = new Date(dateExpiration);
      if (isNaN(dateExpirationParsed.getTime())) {
        res.status(400).json({ error: 'dateExpiration invalide' });
        return;
      }
    }

    const expert = await prismaAny.expertAgree.create({
      data: {
        nom,
        prenom: prenom || null,
        cabinet: cabinet || null,
        telephone: telephone || null,
        email: email || null,
        numeroAgrement,
        dateAgrement: dateAgrementParsed,
        dateExpiration: dateExpirationParsed,
        statut,
        specialites: specialites ? JSON.stringify(specialites) : null,
      },
    });

    logger.info(`Expert agréé créé : ${nom} (${numeroAgrement}) par user ${req.user!.id}`);
    res.status(201).json(expert);
  } catch (err) {
    logger.error('create expert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/experts/:id
 * Modifier un expert agréé
 */
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const existing = await prismaAny.expertAgree.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Expert agréé non trouvé' });
      return;
    }

    const {
      nom,
      prenom,
      cabinet,
      telephone,
      email,
      numeroAgrement,
      dateAgrement,
      dateExpiration,
      statut,
      specialites,
    } = req.body;

    // Vérifier unicité du numéro d'agrément si modifié
    if (numeroAgrement && numeroAgrement !== existing.numeroAgrement) {
      const duplicate = await prismaAny.expertAgree.findUnique({ where: { numeroAgrement } });
      if (duplicate) {
        res.status(409).json({ error: 'Un expert avec ce numéro d\'agrément existe déjà' });
        return;
      }
    }

    const data: Record<string, unknown> = {};
    if (nom !== undefined) data.nom = nom;
    if (prenom !== undefined) data.prenom = prenom;
    if (cabinet !== undefined) data.cabinet = cabinet;
    if (telephone !== undefined) data.telephone = telephone;
    if (email !== undefined) data.email = email;
    if (numeroAgrement !== undefined) data.numeroAgrement = numeroAgrement;
    if (statut !== undefined) data.statut = statut;
    if (specialites !== undefined) data.specialites = JSON.stringify(specialites);

    if (dateAgrement !== undefined) {
      const parsed = new Date(dateAgrement);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({ error: 'dateAgrement invalide' });
        return;
      }
      data.dateAgrement = parsed;
    }

    if (dateExpiration !== undefined) {
      if (dateExpiration === null || dateExpiration === '') {
        data.dateExpiration = null;
      } else {
        const parsed = new Date(dateExpiration);
        if (isNaN(parsed.getTime())) {
          res.status(400).json({ error: 'dateExpiration invalide' });
          return;
        }
        data.dateExpiration = parsed;
      }
    }

    const updated = await prismaAny.expertAgree.update({
      where: { id },
      data,
    });

    logger.info(`Expert agréé ${id} mis à jour par user ${req.user!.id}`);
    res.json(updated);
  } catch (err) {
    logger.error('update expert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/experts/:id
 * Supprimer un expert agréé (admin seulement)
 */
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const existing = await prismaAny.expertAgree.findUnique({
      where: { id },
      include: { _count: { select: { reevaluations: true } } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expert agréé non trouvé' });
      return;
    }

    if (existing._count.reevaluations > 0) {
      res.status(409).json({
        error: `Impossible de supprimer : ${existing._count.reevaluations} réévaluation(s) référencent cet expert`,
      });
      return;
    }

    await prismaAny.expertAgree.delete({ where: { id } });

    logger.info(`Expert agréé ${id} supprimé par admin ${req.user!.id}`);
    res.json({ message: 'Expert agréé supprimé avec succès' });
  } catch (err) {
    logger.error('delete expert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
