'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Wallet,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import VncAreaChart from '@/components/dashboard/VncAreaChart';
import ZoneBarChart from '@/components/dashboard/ZoneBarChart';
import NatureDonutChart from '@/components/dashboard/NatureDonutChart';
import AlertPanel from '@/components/dashboard/AlertPanel';
import LtvGauge from '@/components/hypotheques/LtvGauge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { dashboardApi } from '@/lib/api';
import { formatFCFA, formatPercent } from '@/lib/format';
import type { DashboardStats } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.stats();
      setStats(res.data);
    } catch {
      setError('Impossible de charger les statistiques. Vérifiez la connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-slate-700 font-semibold mb-1">Erreur de chargement</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Hypothèques"
          value={String(stats?.totalHypotheques ?? 0)}
          icon={<Building2 className="w-5 h-5 text-white" />}
          trend={2.4}
          trendLabel="ce mois"
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
        />
        <StatsCard
          title="VNC Totale"
          value={formatFCFA(stats?.vncTotale)}
          icon={<Wallet className="w-5 h-5 text-white" />}
          trend={1.2}
          trendLabel="ce mois"
          gradient="bg-gradient-to-br from-violet-600 to-violet-800"
        />
        <StatsCard
          title="Alertes Actives"
          value={String(stats?.alertesActives ?? 0)}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          badge={
            (stats?.alertesActives ?? 0) > 0
              ? { text: 'Urgent', color: 'bg-red-400/30 text-white' }
              : { text: 'OK', color: 'bg-green-400/30 text-white' }
          }
          gradient="bg-gradient-to-br from-red-500 to-red-700"
        />
        <StatsCard
          title="LTV Moyen"
          value={formatPercent(stats?.ltvMoyen)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          trend={-0.8}
          trendLabel="ce mois"
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — VNC evolution */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Évolution VNC</h2>
              <p className="text-xs text-slate-500">Sur les 12 derniers mois</p>
            </div>
          </div>
          <VncAreaChart data={stats?.evolutionVNC ?? []} />
        </div>

        {/* LTV gauge */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <div className="mb-3 text-center">
            <h2 className="font-semibold text-slate-800">LTV Moyen</h2>
            <p className="text-xs text-slate-500">Ratio Prêt/Valeur</p>
          </div>
          <LtvGauge value={stats?.ltvMoyen ?? 0} size="lg" />
          <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center">
            <div className="rounded-lg bg-green-50 p-2">
              <p className="text-xs text-green-600 font-semibold">≤70%</p>
              <p className="text-xs text-slate-500">Optimal</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-xs text-amber-600 font-semibold">71-100%</p>
              <p className="text-xs text-slate-500">Attention</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-xs text-red-600 font-semibold">&gt;100%</p>
              <p className="text-xs text-slate-500">Critique</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Zone bar chart */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Répartition par Zone</h2>
            <p className="text-xs text-slate-500">Zones géographiques A / B / C</p>
          </div>
          <ZoneBarChart data={stats?.repartitionZone ?? []} />
        </div>

        {/* Nature donut */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Nature des Biens</h2>
            <p className="text-xs text-slate-500">Répartition par type</p>
          </div>
          <NatureDonutChart data={stats?.repartitionNature ?? []} />
        </div>

        {/* Alerts panel */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Alertes Récentes</h2>
              <p className="text-xs text-slate-500">À traiter en priorité</p>
            </div>
            {(stats?.alertesActives ?? 0) > 0 && (
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-1 rounded-full">
                {stats?.alertesActives}
              </span>
            )}
          </div>
          <AlertPanel alertes={stats?.alertesRecentes ?? []} />
        </div>
      </div>

      {/* Top Shortfall Table */}
      {(stats?.topShortfall?.length ?? 0) > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                Top 5 Hypothèques en Shortfall
              </h2>
              <p className="text-xs text-slate-500">
                Dossiers nécessitant une attention immédiate
              </p>
            </div>
            <Link
              href="/hypotheques?statut=SHORTFALL"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Titre Foncier</th>
                  <th>Client</th>
                  <th>Zone</th>
                  <th>VNC</th>
                  <th>Solde Prêt</th>
                  <th>LTV</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topShortfall.map((h) => (
                  <tr key={h.id} className="row-danger">
                    <td>
                      <Link
                        href={`/hypotheques/${h.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {h.numeroTitreFoncier}
                      </Link>
                    </td>
                    <td>{h.nomClient}</td>
                    <td>
                      <span className="badge-info inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                        Zone {h.zoneGeographique}
                      </span>
                    </td>
                    <td className="font-medium">{formatFCFA(h.vnc)}</td>
                    <td>{formatFCFA(h.soldePret)}</td>
                    <td className="font-semibold text-red-600">
                      {h.ltv.toFixed(1)}%
                    </td>
                    <td>
                      <StatusBadge statut={h.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
