'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { AlerteSeverite, AlerteType } from '@/types';

interface Alerte {
  id: number;
  type: AlerteType;
  message: string;
  severite: AlerteSeverite;
  createdAt: string;
}

const SEVERITE_COLORS: Record<AlerteSeverite, string> = {
  LOW:      'text-blue-600 bg-blue-50',
  MEDIUM:   'text-amber-600 bg-amber-50',
  HIGH:     'text-orange-600 bg-orange-50',
  CRITICAL: 'text-red-600 bg-red-50',
};

const SEVERITE_ICONS: Record<AlerteSeverite, typeof Info> = {
  LOW:      Info,
  MEDIUM:   AlertTriangle,
  HIGH:     AlertCircle,
  CRITICAL: AlertCircle,
};

export function ListAlertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/alertes', { params: { limit: 5, statut: 'NON_LU' } })
      .then(res => {
        const data = res.data;
        setAlertes(Array.isArray(data) ? data : data?.alertes ?? []);
      })
      .catch(() => setAlertes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Alertes Récentes</h3>
          <p className="text-xs text-slate-500">Non lues — à traiter</p>
        </div>
        <Bell className="w-4 h-4 text-slate-400" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : alertes.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Aucune alerte en attente
        </div>
      ) : (
        <ul className="space-y-2">
          {alertes.map(alerte => {
            const Icon = SEVERITE_ICONS[alerte.severite] ?? Info;
            const colors = SEVERITE_COLORS[alerte.severite] ?? 'text-slate-600 bg-slate-50';
            return (
              <li key={alerte.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${colors}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <p className="text-xs text-slate-700 line-clamp-2">{alerte.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
