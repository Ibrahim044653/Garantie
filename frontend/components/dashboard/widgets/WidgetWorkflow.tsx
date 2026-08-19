'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitPullRequest, ArrowRight } from 'lucide-react';
import { workflowApi } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface WorkflowItem {
  id: number;
  type: string;
  titre?: string;
  description?: string;
  statut: string;
  createdAt: string;
}

export function WidgetWorkflow() {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowApi.list({ statut: 'EN_ATTENTE', limit: 5 })
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
          <h3 className="text-sm font-semibold text-slate-800">Workflow en attente</h3>
          <p className="text-xs text-slate-500">Demandes à traiter</p>
        </div>
        <GitPullRequest className="w-4 h-4 text-slate-400" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          Aucune demande en attente
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {item.titre ?? item.description ?? item.type}
                </p>
                <p className="text-xs text-slate-500">{item.type} · {formatDate(item.createdAt)}</p>
              </div>
              <Link
                href={`/workflow/${item.id}`}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Traiter <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
