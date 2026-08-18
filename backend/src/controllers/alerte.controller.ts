import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
