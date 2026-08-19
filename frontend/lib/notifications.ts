import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface Notification {
  id: number;
  type: string;
  titre: string;
  message: string;
  entiteType?: string;
  entiteId?: number;
  lu: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications', { params: { limit: 100 } });
      const list: Notification[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setUnreadCount(list.filter((n) => !n.lu).length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { unreadCount, refresh };
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour}h`;
  if (diffDay === 1) return 'hier';

  return `le ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
}

export function getEntityUrl(entiteType?: string, entiteId?: number): string | null {
  if (!entiteType || !entiteId) return null;
  const map: Record<string, string> = {
    HYPOTHEQUE: '/hypotheques',
    CLIENT: '/clients',
    PRET: '/prets',
    WORKFLOW: '/workflow',
    ASSURANCE: '/assurances',
  };
  const base = map[entiteType];
  if (!base) return null;
  return `${base}/${entiteId}`;
}
