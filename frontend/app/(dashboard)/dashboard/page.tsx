'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Bell, TrendingUp, AlertTriangle,
  ArrowUp, ArrowDown, ExternalLink, ChevronRight,
} from 'lucide-react';
import { dashboardApi, apiClient } from '@/lib/api';
import { formatFCFA, formatPercent, formatDate } from '@/lib/format';

interface DashStats {
  totalHypotheques: number;
  alertesActives: number;
  vncTotale: number;
  ltvMoyen: number;
  topShortfall: ShortfallItem[];
}

interface ShortfallItem {
  id: number;
  nomClient: string;
  numeroTitreFoncier: string;
  ltv: number;
  vnc: number;
  soldePret: number;
}

interface RecentHypo {
  id: number;
  numeroTitreFoncier: string;
  nomClient: string;
  zoneGeographique: string;
  vnc: number;
  ltv: number;
  statut: string;
}

interface RecentAlerte {
  id: number;
  type: string;
  message: string;
  severite: string;
  createdAt: string;
}

const ZONE_COLORS: Record<string, string> = {
  ZONE_A: 'text-blue-700 bg-blue-50',
  ZONE_B: 'text-green-700 bg-green-50',
  ZONE_C: 'text-amber-700 bg-amber-50',
  ZONE_INDUSTRIELLE: 'text-violet-700 bg-violet-50',
};
const ZONE_LABELS: Record<string, string> = {
  ZONE_A: 'Zone A',
  ZONE_B: 'Zone B',
  ZONE_C: 'Zone C',
  ZONE_INDUSTRIELLE: 'Zone Ind.',
};
const SEVERITE_COLORS: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [hypos, setHypos] = useState<RecentHypo[]>([]);
  const [alertes, setAlertes] = useState<RecentAlerte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      apiClient.get('/hypotheques', { params: { limit: 8, page: 1 } }),
      apiClient.get('/dashboard/alertes', { params: { limit: 6, statut: 'NON_LU' } }),
    ])
      .then(([sRes, hRes, aRes]) => {
        setStats(sRes.data);
        const hd = hRes.data;
        setHypos(Array.isArray(hd) ? hd : (hd?.data ?? []));
        const ad = aRes.data;
        setAlertes(Array.isArray(ad) ? ad : (ad?.alertes ?? []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Hypothèques',
      display: loading ? null : String(stats?.totalHypotheques ?? '—'),
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trendLabel: 'Dossiers actifs',
      trendUp: true,
    },
    {
      label: 'Alertes actives',
      display: loading ? null : String(stats?.alertesActives ?? '—'),
      icon: Bell,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      trendLabel: 'À traiter',
      trendUp: false,
    },
    {
      label: 'VNC Totale',
      display: loading ? null : (stats?.vncTotale ? formatFCFA(stats.vncTotale) : '—'),
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trendLabel: 'Portefeuille garanti',
      trendUp: true,
    },
    {
      label: 'Shortfalls',
      display: loading ? null : String(stats?.topShortfall?.length ?? '—'),
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      trendLabel: 'LTV > 100%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-5">

      {/* KPI Cards — style D-CLIC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-500 font-medium mb-1">{kpi.label}</p>
                {kpi.display === null ? (
                  <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800 truncate">{kpi.display}</p>
                )}
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.trendUp
                    ? <ArrowUp className="w-3 h-3" />
                    : <ArrowDown className="w-3 h-3" />}
                  <span>{kpi.trendLabel}</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${kpi.iconBg}`}>
                <Icon className={`w-7 h-7 ${kpi.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Contenu principal — 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hypothèques récentes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Hypothèques récentes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Derniers dossiers enregistrés</p>
            </div>
            <Link href="/hypotheques" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-9 bg-slate-50 animate-pulse rounded" />)}
            </div>
          ) : hypos.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm">Aucune hypothèque enregistrée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre Foncier</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Zone</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">VNC</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">LTV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {hypos.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/hypotheques/${h.id}`} className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1">
                          {h.nomClient}
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-xs">{h.numeroTitreFoncier}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ZONE_COLORS[h.zoneGeographique] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ZONE_LABELS[h.zoneGeographique] ?? h.zoneGeographique}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 font-medium tabular-nums text-xs">
                        {formatFCFA(h.vnc)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${h.ltv > 100 ? 'text-red-600' : h.ltv > 85 ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatPercent(h.ltv)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dossiers critiques (Shortfalls) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Dossiers critiques</h2>
              <p className="text-xs text-slate-400 mt-0.5">Shortfalls — LTV &gt; 100%</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg" />)}
              </div>
            ) : (stats?.topShortfall?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-slate-600 font-medium">Aucun shortfall</p>
                <p className="text-xs text-slate-400 mt-0.5">Toutes garanties couvertes</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {(stats?.topShortfall ?? []).slice(0, 7).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/hypotheques/${item.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.nomClient}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.numeroTitreFoncier} —{' '}
                          <span className="text-red-600 font-bold">{formatPercent(item.ltv)}</span>
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {(stats?.topShortfall?.length ?? 0) > 0 && (
              <Link
                href="/alertes"
                className="flex items-center justify-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir toutes les alertes <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Alertes récentes */}
      {(loading || alertes.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Alertes récentes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Non lues — à traiter en priorité</p>
            </div>
            <Link href="/alertes" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              Tout voir <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-50 animate-pulse rounded" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {alertes.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${SEVERITE_COLORS[a.severite] ?? 'bg-slate-100 text-slate-600'}`}>
                    {a.severite}
                  </span>
                  <p className="text-xs text-slate-700 flex-1 min-w-0 truncate">{a.message}</p>
                  <p className="text-xs text-slate-400 flex-shrink-0">{formatDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
