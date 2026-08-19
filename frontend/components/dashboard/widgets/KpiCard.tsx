'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  TrendingUp,
  Bell,
  Percent,
  AlertTriangle,
  Shield,
  TrendingDown,
  CheckCircle,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { dashboardApi, biApi, provisionsApi } from '@/lib/api';
import { formatFCFA, formatPercent } from '@/lib/format';
import type { WidgetId } from '@/types/dashboard';

interface KpiCardProps {
  id: WidgetId;
}

interface KpiMeta {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const KPI_META: Partial<Record<WidgetId, KpiMeta>> = {
  'kpi-vnc':            { label: 'VNC Totale',        icon: Building2,     colorClass: 'text-blue-600',    bgClass: 'bg-blue-50' },
  'kpi-encours':        { label: 'Encours Total',      icon: TrendingUp,    colorClass: 'text-indigo-600',  bgClass: 'bg-indigo-50' },
  'kpi-alertes':        { label: 'Alertes Actives',    icon: Bell,          colorClass: 'text-amber-600',   bgClass: 'bg-amber-50' },
  'kpi-ltv':            { label: 'LTV Moyen',          icon: Percent,       colorClass: 'text-violet-600',  bgClass: 'bg-violet-50' },
  'kpi-shortfalls':     { label: 'Shortfalls',         icon: AlertTriangle, colorClass: 'text-red-500',     bgClass: 'bg-red-50' },
  'kpi-provisions':     { label: 'Provisions IFRS9',   icon: Shield,        colorClass: 'text-orange-600',  bgClass: 'bg-orange-50' },
  'kpi-expected-loss':  { label: 'Expected Loss',      icon: TrendingDown,  colorClass: 'text-red-800',     bgClass: 'bg-red-50' },
  'kpi-taux-couverture':{ label: 'Taux Couverture',    icon: CheckCircle,   colorClass: 'text-green-600',   bgClass: 'bg-green-50' },
  'kpi-nb-hypotheques': { label: 'Nb Hypothèques',     icon: Layers,        colorClass: 'text-slate-600',   bgClass: 'bg-slate-50' },
};

export function KpiCard({ id }: KpiCardProps) {
  const [value, setValue] = useState<string>('—');
  const [loading, setLoading] = useState(true);

  const meta = KPI_META[id];

  useEffect(() => {
    let cancelled = false;

    async function fetchValue() {
      setLoading(true);
      try {
        if (id === 'kpi-provisions') {
          const res = await provisionsApi.get();
          const stats = res.data?.stats ?? res.data;
          const total = stats?.totalProvisions ?? stats?.total ?? null;
          if (!cancelled) setValue(formatFCFA(total));
        } else if (id === 'kpi-expected-loss' || id === 'kpi-taux-couverture' || id === 'kpi-encours') {
          const res = await biApi.overview();
          const d = res.data;
          if (id === 'kpi-expected-loss') {
            if (!cancelled) setValue(formatFCFA(d?.expectedLoss ?? d?.totalExpectedLoss ?? null));
          } else if (id === 'kpi-taux-couverture') {
            if (!cancelled) setValue(formatPercent(d?.tauxCouverture ?? d?.coverageRate ?? null));
          } else {
            if (!cancelled) setValue(formatFCFA(d?.encoursTotale ?? d?.encours ?? null));
          }
        } else {
          const res = await dashboardApi.stats();
          const d = res.data;
          if (cancelled) return;
          switch (id) {
            case 'kpi-vnc':
              setValue(formatFCFA(d?.vncTotale));
              break;
            case 'kpi-alertes':
              setValue(String(d?.alertesActives ?? 0));
              break;
            case 'kpi-ltv':
              setValue(formatPercent(d?.ltvMoyen));
              break;
            case 'kpi-shortfalls':
              setValue(String(d?.topShortfall?.length ?? 0));
              break;
            case 'kpi-nb-hypotheques':
              setValue(String(d?.totalHypotheques ?? 0));
              break;
            default:
              setValue('—');
          }
        }
      } catch {
        if (!cancelled) setValue('—');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchValue();
    return () => { cancelled = true; };
  }, [id]);

  if (!meta) return null;

  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${meta.bgClass}`}>
        <Icon className={`w-5 h-5 ${meta.colorClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 truncate">{meta.label}</p>
        {loading ? (
          <div className="h-6 w-24 bg-slate-100 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
