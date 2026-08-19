'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { dashboardApi } from '@/lib/api';

const VncAreaChart = dynamic(
  () => import('@/components/dashboard/VncAreaChart'),
  { ssr: false }
);

export function ChartEvolutionVNC() {
  const [data, setData] = useState<{ mois: string; vnc: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setData(res.data?.evolutionVNC ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Évolution VNC</h3>
        <p className="text-xs text-slate-500">Sur les 12 derniers mois</p>
      </div>
      {loading ? (
        <div className="h-56 bg-slate-50 animate-pulse rounded-lg" />
      ) : (
        <VncAreaChart data={data} />
      )}
    </div>
  );
}
