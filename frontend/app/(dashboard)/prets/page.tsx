'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, CreditCard, X } from 'lucide-react';
import { pretsApi } from '@/lib/api';
import { formatFCFA, formatDate } from '@/lib/format';
import type { Pret, StatutPret, TypeAmortissement } from '@/types';

const PAGE_SIZE = 15;

const STATUT_BADGE: Record<StatutPret, string> = {
  ACTIF: 'badge-success',
  EN_DEFAUT: 'badge-danger',
  CLOTURE: 'badge-muted',
  RENEGOCIE: 'badge-info',
  SOLDE: 'badge-muted',
};

const AMORTISSEMENT_LABELS: Record<TypeAmortissement, string> = {
  LINEAIRE: 'Linéaire',
  CONSTANT: 'Constant',
  IN_FINE: 'In Fine',
};

interface PretStats {
  encoursTotal: number;
  nbActifs: number;
  nbEnDefaut: number;
  totalImpayes: number;
}

interface PaginatedPrets {
  data: Pret[];
  total: number;
  page: number;
  totalPages: number;
}

const emptyForm = {
  codeClient: '',
  montantInitial: '',
  tauxInteret: '',
  dureeMois: '',
  typeAmortissement: 'LINEAIRE' as TypeAmortissement,
  dateDebut: '',
  objet: '',
};

export default function PretsPage() {
  const [data, setData] = useState<PaginatedPrets | null>(null);
  const [stats, setStats] = useState<PretStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pretsApi.list({
        search: search || undefined,
        statut: statut || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search, statut, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await pretsApi.stats();
      setStats(res.data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await pretsApi.create({
        codeClient: form.codeClient,
        montantInitial: parseFloat(form.montantInitial),
        tauxInteret: parseFloat(form.tauxInteret),
        dureeMois: parseInt(form.dureeMois, 10),
        typeAmortissement: form.typeAmortissement,
        dateDebut: form.dateDebut,
        objet: form.objet || undefined,
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
      fetchStats();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      setError(data?.message ?? data?.error ?? 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Encours total</p>
          <p className="text-lg font-bold text-slate-800 mt-1 tabular-nums">
            {stats ? formatFCFA(stats.encoursTotal) : '—'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Actifs</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats?.nbActifs ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">En défaut</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats?.nbEnDefaut ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Impayés</p>
          <p className="text-lg font-bold text-amber-600 mt-1 tabular-nums">
            {stats ? formatFCFA(stats.totalImpayes) : '—'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par N° prêt ou client..."
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

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="EN_DEFAUT">En défaut</option>
              <option value="CLOTURE">Clôturé</option>
              <option value="RENEGOCIE">Renégocié</option>
              <option value="SOLDE">Soldé</option>
            </select>
          </div>

          <div className="ml-auto flex-shrink-0">
            <button
              onClick={() => { setForm(emptyForm); setError(''); setShowModal(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              Nouveau Prêt
            </button>
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
            <CreditCard className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucun prêt trouvé</p>
            <p className="text-slate-400 text-sm mt-1">Modifiez les filtres ou créez un nouveau prêt</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Prêt</th>
                    <th>Client</th>
                    <th>Montant initial</th>
                    <th>Restant dû</th>
                    <th>Taux</th>
                    <th>Durée</th>
                    <th>Date début</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((p) => {
                    const clientName = p.client
                      ? (p.client.typeClient === 'ENTREPRISE'
                          ? (p.client.raisonSociale ?? p.client.nom)
                          : `${p.client.nom}${p.client.prenom ? ' ' + p.client.prenom : ''}`)
                      : '—';
                    return (
                      <tr key={p.id} className={p.statut === 'EN_DEFAUT' ? 'row-danger' : ''}>
                        <td>
                          <Link
                            href={`/prets/${p.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            {p.numeroPret}
                          </Link>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-slate-800">{clientName}</p>
                            {p.client && (
                              <p className="text-xs text-slate-500">{p.client.codeClient}</p>
                            )}
                          </div>
                        </td>
                        <td className="tabular-nums">{formatFCFA(p.montantInitial)}</td>
                        <td className="tabular-nums font-medium">{formatFCFA(p.montantRestant)}</td>
                        <td className="tabular-nums">{p.tauxInteret?.toFixed(2)}%</td>
                        <td className="text-sm">{p.dureeMois} mois</td>
                        <td className="text-sm text-slate-600">{formatDate(p.dateDebut)}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUT_BADGE[p.statut]}`}>
                            {p.statut}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/prets/${p.id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                {data.total} prêt{data.total !== 1 ? 's' : ''} — Page {data.page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md text-sm hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Préc.
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md text-sm hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suiv.
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal création prêt */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Nouveau prêt</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Code client *</label>
                <input
                  type="text"
                  value={form.codeClient}
                  onChange={(e) => setForm({ ...form, codeClient: e.target.value })}
                  className="form-input"
                  placeholder="Ex: CLI-0001"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.montantInitial}
                    onChange={(e) => setForm({ ...form, montantInitial: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Taux d&apos;intérêt (%) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tauxInteret}
                    onChange={(e) => setForm({ ...form, tauxInteret: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Durée (mois) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.dureeMois}
                    onChange={(e) => setForm({ ...form, dureeMois: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Type amortissement *</label>
                  <select
                    value={form.typeAmortissement}
                    onChange={(e) => setForm({ ...form, typeAmortissement: e.target.value as TypeAmortissement })}
                    className="form-input"
                    required
                  >
                    {Object.entries(AMORTISSEMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Date de début *</label>
                <input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Objet du prêt</label>
                <input
                  type="text"
                  value={form.objet}
                  onChange={(e) => setForm({ ...form, objet: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Acquisition immobilière"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Créer le prêt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
