import { Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// Étapes standard pour toute demande de validation
const ETAPES_STANDARD = [
  { numeroEtape: 1, libelle: 'Validation Gestionnaire', roleRequis: 'GESTIONNAIRE_GARANTIES' },
  { numeroEtape: 2, libelle: 'Validation Responsable Risques', roleRequis: 'RESPONSABLE_RISQUES' },
  { numeroEtape: 3, libelle: 'Approbation Direction', roleRequis: 'ADMIN' },
] as const;

// ─── GET /api/workflow ───────────────────────────────────────────────────────

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { statut, type, createurId, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (createurId) where.createurId = parseInt(createurId as string);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [total, demandes] = await Promise.all([
      prisma.demandeValidation.count({ where }),
      prisma.demandeValidation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createur: { select: { id: true, nom: true, prenom: true, role: true } },
          etapes: { orderBy: { numeroEtape: 'asc' } },
        },
      }),
    ]);

    res.json({
      data: demandes,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    logger.error('workflow.getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/workflow/mes-demandes ─────────────────────────────────────────

export const getMesDemandes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user!.role;

    // Trouver toutes les demandes dont l'étape courante correspond au rôle de l'utilisateur
    const demandes = await prisma.demandeValidation.findMany({
      where: {
        statut: { in: ['EN_ATTENTE', 'EN_COURS'] },
        etapes: {
          some: {
            roleRequis: userRole as UserRole,
            statut: 'EN_ATTENTE',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createur: { select: { id: true, nom: true, prenom: true, role: true } },
        etapes: { orderBy: { numeroEtape: 'asc' } },
      },
    });

    res.json(demandes);
  } catch (err) {
    logger.error('workflow.getMesDemandes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/workflow/:id ───────────────────────────────────────────────────

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const demande = await prisma.demandeValidation.findUnique({
      where: { id },
      include: {
        createur: { select: { id: true, nom: true, prenom: true, role: true } },
        etapes: {
          orderBy: { numeroEtape: 'asc' },
          include: {
            valideur: { select: { id: true, nom: true, prenom: true, role: true } },
          },
        },
      },
    });

    if (!demande) {
      res.status(404).json({ error: 'Demande de validation non trouvée' });
      return;
    }

    res.json(demande);
  } catch (err) {
    logger.error('workflow.getById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/workflow ──────────────────────────────────────────────────────

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, entiteId, entiteType, titre, description } = req.body;

    // Créer la demande + les 3 étapes standard en transaction
    const demande = await prisma.$transaction(async (tx) => {
      const newDemande = await tx.demandeValidation.create({
        data: {
          type,
          entiteId: parseInt(entiteId),
          entiteType,
          titre,
          description: description || null,
          statut: 'EN_ATTENTE',
          createurId: req.user!.id,
          etapeActuelle: 1,
          totalEtapes: 3,
        },
      });

      await tx.etapeValidation.createMany({
        data: ETAPES_STANDARD.map((e) => ({
          demandeId: newDemande.id,
          numeroEtape: e.numeroEtape,
          libelle: e.libelle,
          roleRequis: e.roleRequis,
          statut: 'EN_ATTENTE',
        })),
      });

      return newDemande;
    });

    logger.info(`Demande de validation créée: #${demande.id} (${demande.type}) par ${req.user!.email}`);

    const demandeComplete = await prisma.demandeValidation.findUnique({
      where: { id: demande.id },
      include: {
        createur: { select: { id: true, nom: true, prenom: true, role: true } },
        etapes: { orderBy: { numeroEtape: 'asc' } },
      },
    });

    res.status(201).json(demandeComplete);
  } catch (err) {
    logger.error('workflow.create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/workflow/:id/valider ─────────────────────────────────────────

export const valider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const demandeId = parseInt(req.params.id);
    const { statut, commentaire } = req.body;

    if (!['APPROUVE', 'REJETE'].includes(statut)) {
      res.status(400).json({ error: 'statut doit être APPROUVE ou REJETE' });
      return;
    }

    const demande = await prisma.demandeValidation.findUnique({
      where: { id: demandeId },
      include: { etapes: { orderBy: { numeroEtape: 'asc' } } },
    });

    if (!demande) {
      res.status(404).json({ error: 'Demande de validation non trouvée' });
      return;
    }

    if (!['EN_ATTENTE', 'EN_COURS'].includes(demande.statut)) {
      res.status(400).json({ error: `La demande est déjà ${demande.statut} et ne peut plus être traitée` });
      return;
    }

    // Trouver l'étape courante EN_ATTENTE correspondant au rôle de l'utilisateur
    const etapeCourante = demande.etapes.find(
      (e) => e.numeroEtape === demande.etapeActuelle && e.statut === 'EN_ATTENTE',
    );

    if (!etapeCourante) {
      res.status(400).json({ error: 'Aucune étape en attente pour cette demande' });
      return;
    }

    // Vérifier que l'utilisateur a le bon rôle pour valider cette étape
    if (etapeCourante.roleRequis !== req.user!.role && req.user!.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Vous n\'avez pas le rôle requis pour valider cette étape',
        roleRequis: etapeCourante.roleRequis,
        roleActuel: req.user!.role,
      });
      return;
    }

    const derniereEtape = demande.totalEtapes;

    await prisma.$transaction(async (tx) => {
      // Mettre à jour l'étape courante
      await tx.etapeValidation.update({
        where: { id: etapeCourante.id },
        data: {
          statut,
          valideurId: req.user!.id,
          commentaire: commentaire || null,
          dateTraitement: new Date(),
        },
      });

      if (statut === 'REJETE') {
        // Rejet immédiat de la demande
        await tx.demandeValidation.update({
          where: { id: demandeId },
          data: { statut: 'REJETE' },
        });
      } else if (etapeCourante.numeroEtape >= derniereEtape) {
        // Dernière étape approuvée → demande APPROUVEE
        await tx.demandeValidation.update({
          where: { id: demandeId },
          data: { statut: 'APPROUVE' },
        });
      } else {
        // Passer à l'étape suivante
        const prochaineEtape = etapeCourante.numeroEtape + 1;
        await tx.demandeValidation.update({
          where: { id: demandeId },
          data: { statut: 'EN_COURS', etapeActuelle: prochaineEtape },
        });
      }
    });

    logger.info(
      `Étape ${etapeCourante.numeroEtape} de la demande #${demandeId} ${statut} par ${req.user!.email}`,
    );

    const demandeMAJ = await prisma.demandeValidation.findUnique({
      where: { id: demandeId },
      include: {
        createur: { select: { id: true, nom: true, prenom: true, role: true } },
        etapes: {
          orderBy: { numeroEtape: 'asc' },
          include: {
            valideur: { select: { id: true, nom: true, prenom: true, role: true } },
          },
        },
      },
    });

    res.json(demandeMAJ);
  } catch (err) {
    logger.error('workflow.valider error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
