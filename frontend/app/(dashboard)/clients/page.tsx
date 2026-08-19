'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Users, X } from 'lucide-react';
import { clientsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Client, TypeClient, StatutClient } from '@/types';

const PAGE_SIZE = 15;

const TYPE_LABELS: Record<TypeClient, string> = {
  PARTICULIER: 'Particulier',
  ENTREPRISE: 'Entreprise',
};

const STATUT_LABELS: Record<StatutClient, string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  BLACKLISTE: 'Blacklisté',
};

const STATUT_BADGE: Record<StatutClient, string> = {
  ACTIF: 'badge-success',
  INACTIF: 'badge-muted',
  BLACKLISTE: 'badge-danger',
};

interface Stats {
  total: number;
  particuliers: number;
  entreprises: number;
  actifs: number;
}

interface PaginatedClients {
  data: Client[];
  total: number;
  page: number;
  totalPages: number;
}

const emptyForm = {
  typeClient: 'PARTICULIER' as TypeClient,
  nom: '',
  prenom: '',
  raisonSociale: '',
  telephone: '',
  email: '',
  ville: '',
  adresse: '',
  numeroIdentite: '',
};

export default function ClientsPage() {
  const { canEdit: canEditFn } = useAuth();
  const canEdit = canEditFn();

  const [data, setData] = useState<PaginatedClients | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeClient, setTypeClient] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsApi.list({
        search: search || undefined,
        typeClient: typeClient || undefined,
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
  }, [search, typeClient, statut, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await clientsApi.stats();
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

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      typeClient: client.typeClient,
      nom: client.nom,
      prenom: client.prenom ?? '',
      raisonSociale: client.raisonSociale ?? '',
      telephone: client.telephone ?? '',
      email: client.email ?? '',
      ville: client.ville ?? '',
      adresse: client.adresse ?? '',
      numeroIdentite: client.numeroIdentite ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        prenom: form.typeClient === 'PARTICULIER' ? form.prenom : undefined,
        raisonSociale: form.typeClient === 'ENTREPRISE' ? form.raisonSociale : undefined,
      };
      if (editingClient) {
        await clientsApi.update(editingClient.id, payload);
      } else {
        await clientsApi.create(payload);
      }
      setShowModal(false);
      fetchData();
      fetchStats();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Une erreur est survenue');
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
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total clients</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Particuliers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.particuliers ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Entreprises</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats?.entreprises ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Actifs</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats?.actifs ?? '—'}</p>
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
                placeholder="Rechercher par nom ou code client..."
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
              value={typeClient}
              onChange={(e) => { setTypeClient(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous types</option>
              <option value="PARTICULIER">Particulier</option>
              <option value="ENTREPRISE">Entreprise</option>
            </select>
            <select
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1); }}
              className="form-input w-auto text-sm"
            >
              <option value="">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="BLACKLISTE">Blacklisté</option>
            </select>
          </div>

          {canEdit && (
            <div className="ml-auto flex-shrink-0">
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
              >
                <Plus className="w-4 h-4" />
                Nouveau Client
              </button>
            </div>
          )}
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
            <Users className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucun client trouvé</p>
            <p className="text-slate-400 text-sm mt-1">Modifiez les filtres ou créez un nouveau client</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom / Raison sociale</th>
                    <th>Type</th>
                    <th>Ville</th>
                    <th>Prêts</th>
                    <th>Garanties</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => {
                    const displayName = c.typeClient === 'ENTREPRISE'
                      ? (c.raisonSociale ?? c.nom)
                      : `${c.nom}${c.prenom ? ' ' + c.prenom : ''}`;
                    return (
                      <tr key={c.id}>
                        <td>
                          <Link
                            href={`/clients/${c.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            {c.codeClient}
                          </Link>
                        </td>
                        <td>
                          <p className="font-medium text-slate-800">{displayName}</p>
                          {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            c.typeClient === 'ENTREPRISE' ? 'badge-info' : 'badge-muted'
                          }`}>
                            {TYPE_LABELS[c.typeClient]}
                          </span>
                        </td>
                        <td className="text-sm text-slate-600">{c.ville ?? '—'}</td>
                        <td className="text-center tabular-nums">{c._count?.prets ?? '—'}</td>
                        <td className="text-center tabular-nums">{c._count?.hypotheques ?? '—'}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUT_BADGE[c.statut]}`}>
                            {STATUT_LABELS[c.statut]}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/clients/${c.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Voir
                            </Link>
                            {canEdit && (
                              <button
                                onClick={() => openEdit(c)}
                                className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                              >
                                Modifier
                              </button>
                            )}
                          </div>
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
                {data.total} client{data.total !== 1 ? 's' : ''} — Page {data.page} sur {totalPages}
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

      {/* Modal création/modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </h2>
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
                <label className="form-label">Type de client *</label>
                <select
                  value={form.typeClient}
                  onChange={(e) => setForm({ ...form, typeClient: e.target.value as TypeClient })}
                  className="form-input"
                  required
                >
                  <option value="PARTICULIER">Particulier</option>
                  <option value="ENTREPRISE">Entreprise</option>
                </select>
              </div>

              <div>
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {form.typeClient === 'PARTICULIER' && (
                <div>
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="form-input"
                  />
                </div>
              )}

              {form.typeClient === 'ENTREPRISE' && (
                <div>
                  <label className="form-label">Raison sociale</label>
                  <input
                    type="text"
                    value={form.raisonSociale}
                    onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                    className="form-input"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Téléphone</label>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Ville</label>
                <input
                  type="text"
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Numéro d&apos;identité</label>
                <input
                  type="text"
                  value={form.numeroIdentite}
                  onChange={(e) => setForm({ ...form, numeroIdentite: e.target.value })}
                  className="form-input"
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
                  {saving ? 'Enregistrement...' : editingClient ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
