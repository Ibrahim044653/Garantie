'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { dashboardApi } from '@/lib/api';

const ZoneBarChart = dynamic(
  () => import('@/components/dashboard/ZoneBarChart'),
  { ssr: false }
);

export function ChartZones() {
  const [data, setData] = useState<{ zone: string; count: number; vnc: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setData(res.data?.repartitionZone ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Répartition Zones</h3>
        <p className="text-xs text-slate-500">Par zone géographique</p>
      </div>
      {loading ? (
        <div className="h-56 bg-slate-50 animate-pulse rounded-lg" />
      ) : (
        <ZoneBarChart data={data} />
      )}
    </div>
  );
}
