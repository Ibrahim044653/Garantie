'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { dashboardApi } from '@/lib/api';

const NatureDonutChart = dynamic(
  () => import('@/components/dashboard/NatureDonutChart'),
  { ssr: false }
);

export function ChartNatures() {
  const [data, setData] = useState<{ nature: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setData(res.data?.repartitionNature ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Nature des Biens</h3>
        <p className="text-xs text-slate-500">Répartition par type</p>
      </div>
      {loading ? (
        <div className="h-56 bg-slate-50 animate-pulse rounded-lg" />
      ) : (
        <NatureDonutChart data={data} />
      )}
    </div>
  );
}
