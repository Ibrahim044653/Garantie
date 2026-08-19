import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── GET /api/notifications ──────────────────────────────────────────────────

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt((req.query.limit as string) || '50');
    const unreadOnly = req.query.unreadOnly === 'true';

    const where: Record<string, any> = {
      OR: [{ userId }, { userId: null }],
    };

    if (unreadOnly) {
      where.lu = false;
    }

    const notifications = await prismaAny.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(notifications);
  } catch (err) {
    logger.error('notification.getAll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/notifications/count ────────────────────────────────────────────

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await prismaAny.notification.count({
      where: {
        OR: [{ userId }, { userId: null }],
        lu: false,
      },
    });

    res.json({ count });
  } catch (err) {
    logger.error('notification.getUnreadCount error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/notifications/:id/lu ───────────────────────────────────────────

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'ID invalide' });
      return;
    }

    // Vérifier que la notif appartient à cet user (ou est broadcast)
    const notif = await prismaAny.notification.findUnique({ where: { id } });

    if (!notif) {
      res.status(404).json({ error: 'Notification non trouvée' });
      return;
    }

    if (notif.userId !== null && notif.userId !== userId) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const updated = await prismaAny.notification.update({
      where: { id },
      data: { lu: true },
    });

    res.json(updated);
  } catch (err) {
    logger.error('notification.markRead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/notifications/lu-tout ──────────────────────────────────────────

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prismaAny.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        lu: false,
      },
      data: { lu: true },
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('notification.markAllRead error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/notifications/push-subscribe ───────────────────────────────────

export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { endpoint, p256dh, auth } = req.body;

    if (!endpoint || !p256dh || !auth) {
      res.status(400).json({ error: 'endpoint, p256dh et auth sont requis' });
      return;
    }

    // Upsert par endpoint (évite les doublons)
    const subscription = await prismaAny.webPushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });

    res.status(201).json(subscription);
  } catch (err) {
    logger.error('notification.subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE /api/notifications/push-subscribe ────────────────────────────────

export const unsubscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({ error: 'endpoint requis' });
      return;
    }

    await prismaAny.webPushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('notification.unsubscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/notifications/vapid-key ────────────────────────────────────────

export const getVapidPublicKey = async (_req: AuthRequest, res: Response): Promise<void> => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ publicKey });
};

// ─── GET /api/notifications/stream (SSE) ─────────────────────────────────────

export const sse = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx compatibility
  res.flushHeaders();

  // Envoi initial pour confirmer la connexion
  res.write('data: {"type":"connected"}\n\n');

  let lastChecked = new Date();

  // Polling des nouvelles notifications toutes les 10s
  const pollInterval = setInterval(async () => {
    try {
      const newNotifs = await prismaAny.notification.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
          createdAt: { gt: lastChecked },
        },
        orderBy: { createdAt: 'desc' },
      });

      lastChecked = new Date();

      if (newNotifs.length > 0) {
        const unreadCount = await prismaAny.notification.count({
          where: {
            OR: [{ userId }, { userId: null }],
            lu: false,
          },
        });

        const payload = JSON.stringify({
          count: unreadCount,
          notifications: newNotifs,
        });

        res.write(`event: notifications\ndata: ${payload}\n\n`);
      }
    } catch (err) {
      logger.error('SSE polling error:', err);
    }
  }, 10_000);

  // Heartbeat toutes les 30s pour maintenir la connexion
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  // Nettoyage à la déconnexion du client
  res.on('close', () => {
    clearInterval(pollInterval);
    clearInterval(heartbeatInterval);
    logger.info(`SSE déconnecté pour userId=${userId}`);
  });
};
