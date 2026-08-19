'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { formatFCFA, formatPercent } from '@/lib/format';

interface ShortfallItem {
  id: number;
  nomClient: string;
  numeroTitreFoncier: string;
  ltv: number;
  vnc: number;
  soldePret: number;
}

export function ListShortfalls() {
  const [items, setItems] = useState<ShortfallItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setItems(res.data?.topShortfall ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Top Shortfalls</h3>
          <p className="text-xs text-slate-500">Dossiers critiques</p>
        </div>
        <AlertTriangle className="w-4 h-4 text-red-400" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Aucun shortfall actif
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map(item => (
            <li key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800 truncate">{item.nomClient}</p>
                <p className="text-xs text-slate-500">{item.numeroTitreFoncier} — LTV {formatPercent(item.ltv)}</p>
              </div>
              <Link
                href={`/hypotheques/${item.id}`}
                className="flex-shrink-0 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
