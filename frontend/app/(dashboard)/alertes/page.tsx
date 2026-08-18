'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, AlertTriangle, Filter } from 'lucide-react';
import { alertesApi } from '@/lib/api';
import { formatDate, ALERTE_TYPE_LABELS } from '@/lib/format';
import { SeveriteBadge } from '@/components/shared/StatusBadge';
import type { Alerte, AlerteType, AlerteSeverite } from '@/types';

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statutFilter, setStatutFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alertesApi.list({
        type: typeFilter || undefined,
        statut: statutFilter || undefined,
        limit: 50,
      });
      const data = res.data;
      setAlertes(data.data ?? data);
      setTotal(data.total ?? (data.data ?? data).length);
    } catch {
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statutFilter]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: number) => {
    await alertesApi.markRead(id);
    setAlertes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, statut: 'LU' } : a))
    );
  };

  const markAllRead = async () => {
    await alertesApi.markAllRead();
    setAlertes((prev) => prev.map((a) => ({ ...a, statut: 'LU' })));
  };

  const unreadCount = alertes.filter((a) => a.statut === 'NON_LU').length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Alertes
                {unreadCount > 0 && (
                  <span className="ml-2 badge-danger px-1.5 py-0.5 rounded-full text-xs">
                    {unreadCount} non lues
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">{total} alerte{total !== 1 ? 's' : ''} au total</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous les types</option>
              <option value="SHORTFALL">Shortfall</option>
              <option value="EXPERTISE_OBSOLETE">Expertise Obsolète</option>
              <option value="PEREMPTION_INSCRIPTION">Péremption Inscription</option>
              <option value="LTV_ELEVEE">LTV Élevée</option>
            </select>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous statuts</option>
              <option value="NON_LU">Non lues</option>
              <option value="LU">Lues</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                <CheckCheck className="w-4 h-4" />
                Tout marquer lu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !alertes.length ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucune alerte</p>
            <p className="text-slate-400 text-sm mt-1">
              Vous êtes à jour — aucune alerte correspondante
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Hypothèque</th>
                  <th>Message</th>
                  <th>Sévérité</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((alerte) => (
                  <tr
                    key={alerte.id}
                    className={alerte.statut === 'NON_LU' ? 'bg-blue-50/30' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            alerte.severite === 'CRITICAL'
                              ? 'text-red-500'
                              : alerte.severite === 'HIGH'
                              ? 'text-orange-500'
                              : 'text-amber-500'
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {ALERTE_TYPE_LABELS[alerte.type as AlerteType]}
                        </span>
                      </div>
                    </td>
                    <td>
                      {alerte.hypotheque ? (
                        <Link
                          href={`/hypotheques/${alerte.hypothequeId}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {alerte.hypotheque.numeroTitreFoncier}
                          <p className="text-xs text-slate-500 font-normal">
                            {alerte.hypotheque.nomClient}
                          </p>
                        </Link>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="max-w-xs">
                      <p className="text-sm text-slate-700 truncate">{alerte.message}</p>
                    </td>
                    <td>
                      <SeveriteBadge severite={alerte.severite as AlerteSeverite} />
                    </td>
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(alerte.createdAt)}
                    </td>
                    <td>
                      {alerte.statut === 'NON_LU' ? (
                        <span className="badge-info inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold">
                          Non lue
                        </span>
                      ) : (
                        <span className="badge-muted inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold">
                          Lue
                        </span>
                      )}
                    </td>
                    <td>
                      {alerte.statut === 'NON_LU' && (
                        <button
                          onClick={() => markRead(alerte.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          title="Marquer comme lue"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Marquer lu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
