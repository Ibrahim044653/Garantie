import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── GET /api/audit ───────────────────────────────────────────────────────────
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;
    const entite = req.query.entite as string | undefined;
    const dateDebut = req.query.dateDebut as string | undefined;
    const dateFin = req.query.dateFin as string | undefined;

    const where: Record<string, any> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entite) where.entite = entite;
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }

    const [data, total] = await Promise.all([
      prismaAny.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nom: true, prenom: true, email: true, role: true } },
        },
      }),
      prismaAny.auditLog.count({ where }),
    ]);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error('audit.getAll error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des logs d\'audit' });
  }
}

// ─── GET /api/audit/export ────────────────────────────────────────────────────
export async function exportCsv(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;
    const entite = req.query.entite as string | undefined;
    const dateDebut = req.query.dateDebut as string | undefined;
    const dateFin = req.query.dateFin as string | undefined;

    const where: Record<string, any> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entite) where.entite = entite;
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }

    const logs = await prismaAny.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: {
        user: { select: { nom: true, prenom: true, email: true, role: true } },
      },
    });

    const headers = ['ID', 'Utilisateur', 'Rôle', 'Action', 'Entité', 'EntitéID', 'Détails', 'IP', 'Date'];
    const rows = logs.map((log: any) => {
      const userName = log.user ? `${log.user.prenom} ${log.user.nom}` : 'Système';
      const role = log.user?.role ?? '';
      const details = log.details ? log.details.replace(/"/g, '""') : '';
      const date = log.createdAt ? new Date(log.createdAt).toISOString() : '';
      return [
        log.id,
        `"${userName}"`,
        role,
        log.action,
        log.entite,
        log.entiteId ?? '',
        `"${details}"`,
        log.ip ?? '',
        date,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send('﻿' + csv); // BOM UTF-8
  } catch (err) {
    logger.error('audit.exportCsv error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'export CSV' });
  }
}
