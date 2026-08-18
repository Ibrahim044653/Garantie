'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { hypothequesApi, downloadBlob } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatFCFA, formatDate, NATURE_LABELS, ZONE_LABELS } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type {
  Hypotheque,
  NatureBien,
  ZoneGeographique,
  StatutHypotheque,
  StatutOccupation,
  PaginatedResponse,
} from '@/types';

const PAGE_SIZE = 15;

export default function HypothequesPage() {
  const { canEdit } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Hypotheque> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [zone, setZone] = useState<string>(searchParams.get('zone') ?? '');
  const [nature, setNature] = useState<string>(searchParams.get('nature') ?? '');
  const [statut, setStatut] = useState<string>(searchParams.get('statut') ?? '');
  const [occupation, setOccupation] = useState<string>('');
  const [alerte, setAlerte] = useState<string>('');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hypothequesApi.list({
        search: search || undefined,
        zone: zone || undefined,
        nature: nature || undefined,
        statut: statut || undefined,
        statutOccupation: occupation || undefined,
        alerte: alerte === 'oui' ? true : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search, zone, nature, statut, occupation, alerte, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const filters = {
    search: search || undefined,
    zone: zone || undefined,
    nature: nature || undefined,
    statut: statut || undefined,
  };

  const handleExportCsv = async () => {
    try {
      const res = await hypothequesApi.exportCsv(filters);
      downloadBlob(res.data, `hypotheques_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await hypothequesApi.exportExcel(filters);
      downloadBlob(res.data, `hypotheques_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      alert('Erreur lors de l\'export Excel');
    }
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par client ou N° TF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              Chercher
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

            <select
              value={zone}
              onChange={(e) => { setZone(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Toutes les zones</option>
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>

            <select
              value={nature}
              onChange={(e) => { setNature(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Toutes natures</option>
              <option value="VILLA">Villa</option>
              <option value="APPARTEMENT">Appartement</option>
              <option value="TERRAIN">Terrain</option>
              <option value="LOCAL_COMMERCIAL">Local Commercial</option>
              <option value="IMMEUBLE">Immeuble</option>
            </select>

            <select
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous statuts</option>
              <option value="A_JOUR">À jour</option>
              <option value="EXPERTISE_OBSOLETE">Expertise Obsolète</option>
              <option value="SHORTFALL">Shortfall</option>
            </select>

            <select
              value={occupation}
              onChange={(e) => { setOccupation(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Occupation</option>
              <option value="OCCUPE_PROPRIETAIRE">Occupé (Prop.)</option>
              <option value="LOUE">Loué</option>
              <option value="VACANT">Vacant</option>
            </select>

            <select
              value={alerte}
              onChange={(e) => { setAlerte(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Alertes</option>
              <option value="oui">Avec alerte</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto flex-shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            {canEdit() && (
              <Link
                href="/hypotheques/new"
                className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Hypothèque
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucune hypothèque trouvée</p>
            <p className="text-slate-400 text-sm mt-1">
              Modifiez les filtres ou créez une nouvelle hypothèque
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Titre Foncier</th>
                    <th>Client</th>
                    <th>Nature</th>
                    <th>Zone</th>
                    <th>VNC</th>
                    <th>LTV</th>
                    <th>Statut</th>
                    <th>Alertes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((h) => (
                    <tr
                      key={h.id}
                      className={
                        h.statut === 'SHORTFALL'
                          ? 'row-danger'
                          : h.statut === 'EXPERTISE_OBSOLETE'
                          ? 'row-warning'
                          : ''
                      }
                    >
                      <td>
                        <Link
                          href={`/hypotheques/${h.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                          {h.numeroTitreFoncier}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800">{h.nomClient}</p>
                          <p className="text-xs text-slate-500">{h.codeClient}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">
                          {NATURE_LABELS[h.natureBien as NatureBien]}
                        </span>
                      </td>
                      <td>
                        <span className="badge-info inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                          {ZONE_LABELS[h.zoneGeographique as ZoneGeographique]}
                        </span>
                      </td>
                      <td className="font-medium tabular-nums">
                        {formatFCFA(h.vnc)}
                      </td>
                      <td>
                        <span
                          className={`font-semibold tabular-nums text-sm ${
                            h.ltv > 100
                              ? 'text-red-600'
                              : h.ltv > 80
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }`}
                        >
                          {h.ltv?.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <StatusBadge statut={h.statut as StatutHypotheque} />
                      </td>
                      <td>
                        {(h.alertes?.length ?? 0) > 0 ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {h.alertes?.length}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/hypotheques/${h.id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir
                          </Link>
                          {canEdit() && (
                            <Link
                              href={`/hypotheques/${h.id}/edit`}
                              className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                            >
                              Modifier
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                {data.total} hypothèque{data.total !== 1 ? 's' : ''} —
                Page {data.page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p =
                    totalPages <= 5
                      ? i + 1
                      : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                      ? totalPages - 4 + i
                      : page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
