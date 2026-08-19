'use client';

import { useEffect, useState, useCallback } from 'react';
import { Award, Plus, Edit2, ToggleLeft, AlertTriangle, X, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface ExpertAgree {
  id: number;
  numeroAgrement: string;
  nom: string;
  cabinet?: string;
  telephone?: string;
  email?: string;
  specialisation?: string;
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  dateAgrement: string;
  dateExpiration: string;
}

const STATUT_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  SUSPENDU: 'Suspendu',
};

const STATUT_BADGE: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700 border-green-200',
  INACTIF: 'bg-slate-100 text-slate-600 border-slate-200',
  SUSPENDU: 'bg-red-100 text-red-700 border-red-200',
};

function isExpiringWithin6Months(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return date > now && date <= sixMonths;
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

const EMPTY_FORM = {
  numeroAgrement: '',
  nom: '',
  cabinet: '',
  telephone: '',
  email: '',
  specialisation: '',
  statut: 'ACTIF' as ExpertAgree['statut'],
  dateAgrement: '',
  dateExpiration: '',
};

export default function ExpertsPage() {
  const [experts, setExperts] = useState<ExpertAgree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/experts');
      const list: ExpertAgree[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setExperts(list);
    } catch {
      setError('Erreur lors du chargement des experts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (expert: ExpertAgree) => {
    setEditingId(expert.id);
    setForm({
      numeroAgrement: expert.numeroAgrement,
      nom: expert.nom,
      cabinet: expert.cabinet ?? '',
      telephone: expert.telephone ?? '',
      email: expert.email ?? '',
      specialisation: expert.specialisation ?? '',
      statut: expert.statut,
      dateAgrement: expert.dateAgrement?.slice(0, 10) ?? '',
      dateExpiration: expert.dateExpiration?.slice(0, 10) ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleToggleStatut = async (expert: ExpertAgree) => {
    const newStatut = expert.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      await apiClient.put(`/experts/${expert.id}`, { ...expert, statut: newStatut });
      setExperts((prev) =>
        prev.map((e) => (e.id === expert.id ? { ...e, statut: newStatut } : e))
      );
    } catch {
      // silent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.numeroAgrement.trim()) { setFormError('Le numéro d\'agrément est requis.'); return; }
    if (!form.nom.trim()) { setFormError('Le nom est requis.'); return; }
    if (!form.dateAgrement) { setFormError('La date d\'agrément est requise.'); return; }
    if (!form.dateExpiration) { setFormError('La date d\'expiration est requise.'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cabinet: form.cabinet || undefined,
        telephone: form.telephone || undefined,
        email: form.email || undefined,
        specialisation: form.specialisation || undefined,
      };
      if (editingId) {
        await apiClient.put(`/experts/${editingId}`, payload);
      } else {
        await apiClient.post('/experts', payload);
      }
      setShowModal(false);
      await fetchExperts();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de l\'enregistrement';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Experts agréés
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestion des experts agréés pour les évaluations immobilières
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          Ajouter un expert
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : experts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Award className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium text-slate-500">Aucun expert agréé enregistré</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ajouter le premier expert →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Agrément</th>
                  <th>Nom</th>
                  <th>Cabinet</th>
                  <th>Téléphone</th>
                  <th>Date agrément</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {experts.map((expert) => {
                  const expiring = isExpiringWithin6Months(expert.dateExpiration);
                  const expired = isExpired(expert.dateExpiration);
                  return (
                    <tr key={expert.id}>
                      <td className="font-mono text-xs font-semibold text-slate-700">
                        {expert.numeroAgrement}
                      </td>
                      <td className="font-medium text-slate-800">{expert.nom}</td>
                      <td className="text-slate-600">{expert.cabinet ?? '—'}</td>
                      <td className="text-slate-600">{expert.telephone ?? '—'}</td>
                      <td className="text-slate-600 text-xs">{formatDate(expert.dateAgrement)}</td>
                      <td>
                        <span
                          className={`text-xs font-medium ${
                            expired
                              ? 'text-red-600'
                              : expiring
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatDate(expert.dateExpiration)}
                          {expired && ' (expiré)'}
                          {!expired && expiring && ' (< 6 mois)'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            STATUT_BADGE[expert.statut]
                          }`}
                        >
                          {STATUT_LABELS[expert.statut]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(expert)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatut(expert)}
                            className={`p-1.5 rounded hover:bg-slate-100 ${
                              expert.statut === 'ACTIF'
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={expert.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                          >
                            <ToggleLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                {editingId ? 'Modifier l\'expert' : 'Ajouter un expert agréé'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">N° Agrément *</label>
                  <input
                    type="text"
                    value={form.numeroAgrement}
                    onChange={(e) => updateForm('numeroAgrement', e.target.value)}
                    className="form-input"
                    placeholder="ex: AGR-2024-001"
                    disabled={saving}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Statut</label>
                  <select
                    value={form.statut}
                    onChange={(e) => updateForm('statut', e.target.value)}
                    className="form-input"
                    disabled={saving}
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="SUSPENDU">Suspendu</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Nom complet *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => updateForm('nom', e.target.value)}
                    className="form-input"
                    placeholder="Nom de l'expert"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Cabinet</label>
                  <input
                    type="text"
                    value={form.cabinet}
                    onChange={(e) => updateForm('cabinet', e.target.value)}
                    className="form-input"
                    placeholder="Nom du cabinet"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => updateForm('telephone', e.target.value)}
                    className="form-input"
                    placeholder="+221 XX XXX XX XX"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="form-input"
                    placeholder="expert@cabinet.sn"
                    disabled={saving}
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Spécialisation</label>
                  <input
                    type="text"
                    value={form.specialisation}
                    onChange={(e) => updateForm('specialisation', e.target.value)}
                    className="form-input"
                    placeholder="ex: Immobilier résidentiel, Commercial..."
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="form-label">Date agrément *</label>
                  <input
                    type="date"
                    value={form.dateAgrement}
                    onChange={(e) => updateForm('dateAgrement', e.target.value)}
                    className="form-input"
                    disabled={saving}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Date expiration *</label>
                  <input
                    type="date"
                    value={form.dateExpiration}
                    onChange={(e) => updateForm('dateExpiration', e.target.value)}
                    className="form-input"
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-blue-400"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
