'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Shield,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { type Notification, timeAgo, getEntityUrl } from '@/lib/notifications';

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'SHORTFALL_DETECTE', label: 'Shortfall détecté' },
  { value: 'WORKFLOW_EN_ATTENTE', label: 'Workflow en attente' },
  { value: 'WORKFLOW_APPROUVE', label: 'Workflow approuvé' },
  { value: 'WORKFLOW_REJETE', label: 'Workflow rejeté' },
  { value: 'EXPERTISE_RENOUVELER', label: 'Expertise à renouveler' },
  { value: 'ECHEANCE_PROCHE', label: 'Échéance proche' },
  { value: 'ASSURANCE_EXPIRATION', label: 'Expiration assurance' },
  { value: 'SYSTEME', label: 'Système' },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
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

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLu, setFilterLu] = useState<'' | 'false'>('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      if (filterLu === 'false') params.lu = false;
      if (filterType) params.type = filterType;

      const res = await apiClient.get('/notifications', { params });
      const list: Notification[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setNotifications(list);
      setTotal(res.data?.total ?? list.length);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterLu, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClickNotif = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await apiClient.put(`/notifications/${notif.id}/lu`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n))
        );
      } catch {
        // silent
      }
    }
    const url = getEntityUrl(notif.entiteType, notif.entiteId);
    if (url) router.push(url);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.put('/notifications/lu-tout');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notifications
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Centre de notifications du système SGH
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-blue-400"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? 'Traitement...' : 'Tout marquer comme lu'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />

        {/* Read/Unread filter */}
        <div className="flex gap-1">
          {[
            { value: '' as const, label: 'Toutes' },
            { value: 'false' as const, label: 'Non lues' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilterLu(opt.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterLu === opt.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="form-input py-1.5 text-sm max-w-56"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium text-slate-500">Aucune notification</p>
            <p className="text-sm mt-1">
              {filterLu === 'false' ? 'Toutes vos notifications sont lues.' : 'Aucune notification pour le moment.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notif) => {
              const cfg = getConfig(notif.type);
              const Icon = cfg.icon;
              const entityUrl = getEntityUrl(notif.entiteType, notif.entiteId);
              return (
                <li key={notif.id}>
                  <button
                    onClick={() => handleClickNotif(notif)}
                    className={`w-full text-left px-5 py-4 flex gap-4 hover:bg-slate-50 transition-colors ${
                      !notif.lu ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800 leading-tight">
                          {notif.titre}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notif.lu && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {entityUrl && (
                        <span className="text-xs text-blue-600 mt-1 inline-block">
                          Voir le détail →
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
