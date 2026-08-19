'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Shield,
  Bell,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { type Notification, timeAgo, getEntityUrl } from '@/lib/notifications';

interface NotificationPanelProps {
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  SHORTFALL_DETECTE: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  WORKFLOW_EN_ATTENTE: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  WORKFLOW_APPROUVE: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  WORKFLOW_REJETE: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  EXPERTISE_RENOUVELER: { icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-50' },
  ECHEANCE_PROCHE: { icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
  ASSURANCE_EXPIRATION: { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
  SYSTEME: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.SYSTEME;
}

export default function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications', { params: { limit: 20 } });
      const list: Notification[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setNotifications(list);
      onCountChange?.(list.filter((n) => !n.lu).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClickNotif = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await apiClient.put(`/notifications/${notif.id}/lu`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n))
        );
        onCountChange?.(
          notifications.filter((n) => !n.lu && n.id !== notif.id).length
        );
      } catch {
        // silent
      }
    }
    const url = getEntityUrl(notif.entiteType, notif.entiteId);
    if (url) {
      router.push(url);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.put('/notifications/lu-tout');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      onCountChange?.(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-16 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="min-w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1 font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {markingAll ? 'Traitement...' : 'Tout marquer lu'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 text-slate-500"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notif) => {
                const cfg = getConfig(notif.type);
                const Icon = cfg.icon;
                const hasLink = !!getEntityUrl(notif.entiteType, notif.entiteId);
                return (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleClickNotif(notif)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        !notif.lu ? 'bg-blue-50/60' : 'bg-white'
                      } ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                            {notif.titre}
                          </p>
                          {!notif.lu && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </div>
    </>
  );
}
