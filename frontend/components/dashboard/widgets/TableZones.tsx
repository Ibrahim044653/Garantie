'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { formatFCFA, formatPercent } from '@/lib/format';

interface ZoneData {
  zone: string;
  count: number;
  vnc: number;
  ltvMoyen?: number;
}

export function TableZones() {
  const [data, setData] = useState<ZoneData[]>([]);
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
        <h3 className="text-sm font-semibold text-slate-800">Performance par Zone</h3>
        <p className="text-xs text-slate-500">Vue consolidée par zone géographique</p>
      </div>

      {loading ? (
        <div className="h-32 bg-slate-50 animate-pulse rounded-lg" />
      ) : data.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Aucune donnée disponible
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Zone</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">Nb Hypo.</th>
                <th className="text-right py-2 pr-4 text-slate-500 font-medium">VNC</th>
                <th className="text-right py-2 text-slate-500 font-medium">LTV Moyen</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.zone} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-700">Zone {row.zone}</td>
                  <td className="py-2 pr-4 text-right text-slate-600">{row.count}</td>
                  <td className="py-2 pr-4 text-right text-slate-600">{formatFCFA(row.vnc)}</td>
                  <td className="py-2 text-right text-slate-600">
                    {row.ltvMoyen != null ? formatPercent(row.ltvMoyen) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
