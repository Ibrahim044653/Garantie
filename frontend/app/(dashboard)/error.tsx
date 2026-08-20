'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SGH] Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="p-4 rounded-full bg-red-50">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-slate-500 mb-1">
          {error.message || 'Erreur inattendue lors du chargement de la page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">
            Réf : {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
      >
        <RefreshCw className="w-4 h-4" />
        Réessayer
      </button>
    </div>
  );
}
