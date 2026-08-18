'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { hypothequesApi } from '@/lib/api';
import HypothequeForm from '@/components/hypotheques/HypothequeForm';
import type { Hypotheque } from '@/types';

export default function EditHypothequePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [hyp, setHyp] = useState<Hypotheque | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hypothequesApi
      .get(id)
      .then((res) => setHyp(res.data))
      .catch(() => setHyp(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hyp) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">Hypothèque introuvable</p>
        <Link href="/hypotheques" className="text-blue-600 text-sm mt-2 inline-block">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/hypotheques/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Fiche {hyp.numeroTitreFoncier}
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Modifier — {hyp.numeroTitreFoncier}
        </h2>
        <p className="text-slate-500 text-sm mt-1">{hyp.nomClient}</p>
      </div>
      <HypothequeForm initial={hyp} />
    </div>
  );
}
