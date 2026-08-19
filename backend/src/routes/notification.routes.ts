import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAll,
  getUnreadCount,
  markRead,
  markAllRead,
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  sse,
} from '../controllers/notification.controller';

export const notificationRouter = Router();

// Toutes les routes nécessitent une authentification
notificationRouter.use(authenticate);

// GET /api/notifications/vapid-key — doit être AVANT /:id pour éviter tout conflit
notificationRouter.get('/vapid-key', getVapidPublicKey);

// GET /api/notifications/count
notificationRouter.get('/count', getUnreadCount);

// GET /api/notifications/stream — SSE endpoint
notificationRouter.get('/stream', sse);

// PUT /api/notifications/lu-tout — doit être AVANT /:id/lu
notificationRouter.put('/lu-tout', markAllRead);

// GET /api/notifications
notificationRouter.get('/', getAll);

// PUT /api/notifications/:id/lu
notificationRouter.put('/:id/lu', markRead);

// POST /api/notifications/push-subscribe
notificationRouter.post('/push-subscribe', subscribe);

// DELETE /api/notifications/push-subscribe
notificationRouter.delete('/push-subscribe', unsubscribe);
