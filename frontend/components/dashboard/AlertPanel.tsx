import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { Alerte } from '@/types';
import { ALERTE_TYPE_LABELS, formatDate } from '@/lib/format';
import { SeveriteBadge } from '@/components/shared/StatusBadge';

interface AlertPanelProps {
  alertes: Alerte[];
}

export default function AlertPanel({ alertes }: AlertPanelProps) {
  if (!alertes?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-slate-600 font-medium text-sm">Aucune alerte active</p>
        <p className="text-slate-400 text-xs mt-1">Toutes les hypothèques sont conformes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alertes.slice(0, 8).map((alerte) => (
        <div
          key={alerte.id}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            alerte.statut === 'NON_LU'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white border-transparent opacity-70'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              alerte.severite === 'CRITICAL'
                ? 'text-red-500'
                : alerte.severite === 'HIGH'
                ? 'text-orange-500'
                : alerte.severite === 'MEDIUM'
                ? 'text-amber-500'
                : 'text-slate-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">
                {ALERTE_TYPE_LABELS[alerte.type]}
              </span>
              <SeveriteBadge severite={alerte.severite} />
            </div>
            <p className="text-xs text-slate-600 mt-0.5 truncate">{alerte.message}</p>
            {alerte.hypotheque && (
              <p className="text-xs text-slate-400 mt-0.5">
                TF: {alerte.hypotheque.numeroTitreFoncier} — {alerte.hypotheque.nomClient}
              </p>
            )}
            <p className="text-xs text-slate-400">{formatDate(alerte.createdAt)}</p>
          </div>
        </div>
      ))}

      <Link
        href="/alertes"
        className="flex items-center justify-center gap-2 w-full py-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        Voir toutes les alertes
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
