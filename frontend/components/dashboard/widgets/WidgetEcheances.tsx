'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { pretsApi } from '@/lib/api';
import { formatDate, formatFCFA } from '@/lib/format';

interface EcheanceItem {
  id: number;
  numeroPret: string;
  dateEcheance?: string;
  dateProchainePaie?: string;
  montantEcheance?: number;
  montant?: number;
}

export function WidgetEcheances() {
  const [items, setItems] = useState<EcheanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const in30days = new Date();
    in30days.setDate(today.getDate() + 30);

    pretsApi.list({ dateEcheanceBefore: in30days.toISOString().split('T')[0], limit: 5 })
      .then(res => {
        const d = res.data;
        setItems(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Échéances Proches</h3>
          <p className="text-xs text-slate-500">30 prochains jours</p>
        </div>
        <Calendar className="w-4 h-4 text-slate-400" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Aucune échéance dans les 30 jours
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map(item => {
            const dateStr = item.dateEcheance ?? item.dateProchainePaie;
            const montant = item.montantEcheance ?? item.montant;
            return (
              <li key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 truncate">{item.numeroPret}</p>
                  <p className="text-xs text-slate-500">{formatDate(dateStr ?? null)}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-semibold text-blue-700">
                  {montant != null ? formatFCFA(montant) : '—'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
