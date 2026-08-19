import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── GET /api/mainlevees ──────────────────────────────────────────────────────
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const statut = req.query.statut as string | undefined;

    const where: Record<string, any> = {};
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      prismaAny.mainleveeRadiation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hypotheque: {
            select: { nomClient: true, numeroPret: true, numeroTitreFoncier: true },
          },
          createdBy: { select: { nom: true, prenom: true } },
        },
      }),
      prismaAny.mainleveeRadiation.count({ where }),
    ]);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error('mainlevee.getAll error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des mainlevées' });
  }
}

// ─── GET /api/mainlevees/:id ──────────────────────────────────────────────────
export async function getById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const mainlevee = await prismaAny.mainleveeRadiation.findUnique({
      where: { id },
      include: {
        hypotheque: {
          include: {
            client: true,
            pret: true,
          },
        },
        createdBy: { select: { id: true, nom: true, prenom: true, role: true } },
      },
    });

    if (!mainlevee) {
      res.status(404).json({ error: 'Mainlevée introuvable' });
      return;
    }

    res.json(mainlevee);
  } catch (err) {
    logger.error('mainlevee.getById error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la mainlevée' });
  }
}

// ─── POST /api/mainlevees ─────────────────────────────────────────────────────
export async function create(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { hypothequeId, motif, observations } = req.body;

    if (!hypothequeId || !motif) {
      res.status(400).json({ error: 'hypothequeId et motif sont requis' });
      return;
    }

    // Vérifier que l'hypothèque existe
    const hypotheque = await prisma.hypotheque.findUnique({ where: { id: Number(hypothequeId) } });
    if (!hypotheque) {
      res.status(404).json({ error: 'Hypothèque introuvable' });
      return;
    }

    // Vérifier qu'il n'y a pas déjà une mainlevée en cours
    const existante = await prismaAny.mainleveeRadiation.findFirst({
      where: {
        hypothequeId: Number(hypothequeId),
        statut: { in: ['EN_PREPARATION', 'EN_ATTENTE_NOTAIRE', 'EN_ATTENTE_CONSERVATION'] },
      },
    });
    if (existante) {
      res.status(409).json({ error: 'Une mainlevée est déjà en cours pour cette hypothèque' });
      return;
    }

    const mainlevee = await prismaAny.mainleveeRadiation.create({
      data: {
        hypothequeId: Number(hypothequeId),
        motif,
        observations: observations ?? null,
        statut: 'EN_PREPARATION',
        createdById: req.user!.id,
      },
    });

    // Audit
    await prismaAny.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entite: 'mainlevee',
        entiteId: String(mainlevee.id),
        details: JSON.stringify({ hypothequeId, motif }),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 200) ?? null,
      },
    }).catch(() => {});

    res.status(201).json(mainlevee);
  } catch (err) {
    logger.error('mainlevee.create error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la mainlevée' });
  }
}

// ─── PUT /api/mainlevees/:id/statut ──────────────────────────────────────────
export async function updateStatut(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const {
      statut,
      referenceNotaire,
      dateNotaire,
      referenceConservation,
      dateConservationFonciere,
      dateRadiation,
      observations,
    } = req.body;

    if (!statut) {
      res.status(400).json({ error: 'statut est requis' });
      return;
    }

    const existing = await prismaAny.mainleveeRadiation.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Mainlevée introuvable' });
      return;
    }

    const updateData: Record<string, any> = { statut };
    if (referenceNotaire !== undefined) updateData.referenceNotaire = referenceNotaire;
    if (dateNotaire !== undefined) updateData.dateNotaire = new Date(dateNotaire);
    if (referenceConservation !== undefined) updateData.referenceConservation = referenceConservation;
    if (dateConservationFonciere !== undefined) updateData.dateConservationFonciere = new Date(dateConservationFonciere);
    if (dateRadiation !== undefined) updateData.dateRadiation = new Date(dateRadiation);
    if (observations !== undefined) updateData.observations = observations;

    const mainlevee = await prismaAny.mainleveeRadiation.update({
      where: { id },
      data: updateData,
    });

    // Si COMPLETE, mettre à jour updatedAt de l'hypothèque (signal radiation)
    if (statut === 'COMPLETE') {
      await prisma.hypotheque.update({
        where: { id: existing.hypothequeId },
        data: { updatedAt: new Date() },
      });
    }

    // Audit
    await prismaAny.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entite: 'mainlevee',
        entiteId: String(id),
        details: JSON.stringify({ avant: { statut: existing.statut }, apres: { statut } }),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 200) ?? null,
      },
    }).catch(() => {});

    res.json(mainlevee);
  } catch (err) {
    logger.error('mainlevee.updateStatut error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
}

// ─── PUT /api/mainlevees/:id/documents ───────────────────────────────────────
export async function addDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { documentId } = req.body;

    if (!documentId) {
      res.status(400).json({ error: 'documentId est requis' });
      return;
    }

    // Vérifier le document GED
    const doc = await prismaAny.document.findUnique({ where: { id: Number(documentId) } });
    if (!doc) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
    }

    const existing = await prismaAny.mainleveeRadiation.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Mainlevée introuvable' });
      return;
    }

    const currentIds: number[] = existing.documentGedIds ? JSON.parse(existing.documentGedIds) : [];
    if (!currentIds.includes(Number(documentId))) {
      currentIds.push(Number(documentId));
    }

    const updated = await prismaAny.mainleveeRadiation.update({
      where: { id },
      data: { documentGedIds: JSON.stringify(currentIds) },
    });

    res.json(updated);
  } catch (err) {
    logger.error('mainlevee.addDocument error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du document' });
  }
}

// ─── GET /api/mainlevees/:id/acte-pdf ────────────────────────────────────────
export async function generateActe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    const mainlevee = await prismaAny.mainleveeRadiation.findUnique({
      where: { id },
      include: {
        hypotheque: {
          include: {
            client: true,
            pret: true,
          },
        },
        createdBy: { select: { nom: true, prenom: true, role: true } },
      },
    });

    if (!mainlevee) {
      res.status(404).json({ error: 'Mainlevée introuvable' });
      return;
    }

    const { hypotheque, ...mainleveeData } = mainlevee;
    const { client, pret, ...hypothequeData } = hypotheque || {};

    res.json({
      mainlevee: mainleveeData,
      hypotheque: hypothequeData,
      client: client ?? null,
      pret: pret ?? null,
    });
  } catch (err) {
    logger.error('mainlevee.generateActe error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'acte' });
  }
}
