'use client';

import { useEffect, useState, useCallback } from 'react';
import { GitBranch, X, CheckCircle, XCircle } from 'lucide-react';
import { workflowApi } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import type { DemandeValidation, StatutDemande, TypeDemande, UserRole } from '@/types';

const STATUT_BADGE: Record<StatutDemande, string> = {
  EN_ATTENTE: 'badge-muted',
  EN_COURS: 'badge-info',
  APPROUVE: 'badge-success',
  REJETE: 'badge-danger',
  ANNULE: 'badge-muted',
};

const STATUT_LABEL: Record<StatutDemande, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
  ANNULE: 'Annulé',
};

const TYPE_LABEL: Record<TypeDemande, string> = {
  CREATION_HYPOTHEQUE: 'Création hypothèque',
  REEVALUATION: 'Réévaluation',
  RADIATION: 'Radiation',
  CREATION_PRET: 'Création prêt',
  MODIFICATION_PRET: 'Modification prêt',
};

const ROLES_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE_GARANTIES: 'Gestionnaire Garanties',
  RESPONSABLE_RISQUES: 'Responsable Risques',
  ENGAGEMENTS: 'Engagements',
  AUDIT_INTERNE: 'Audit Interne',
};

type Tab = 'toutes' | 'mes-demandes';

export default function WorkflowPage() {
  const { hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('toutes');
  const [demandes, setDemandes] = useState<DemandeValidation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDemande, setSelectedDemande] = useState<DemandeValidation | null>(null);
  const [validationForm, setValidationForm] = useState<{ decision: 'APPROUVE' | 'REJETE'; commentaire: string }>({
    decision: 'APPROUVE',
    commentaire: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'mes-demandes') {
        res = await workflowApi.mesDemandes();
      } else {
        res = await workflowApi.list();
      }
      const raw = res.data;
      setDemandes(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // Determine if the current user can validate the active step of a demande
  const canValidate = (demande: DemandeValidation): boolean => {
    if (!demande.etapes?.length) return false;
    const etapeActive = demande.etapes.find((e) => e.numeroEtape === demande.etapeActuelle);
    if (!etapeActive) return false;
    if (etapeActive.statut !== 'EN_ATTENTE' && etapeActive.statut !== 'EN_COURS') return false;
    return hasRole(etapeActive.roleRequis as UserRole);
  };

  const openValidation = (demande: DemandeValidation) => {
    setSelectedDemande(demande);
    setValidationForm({ decision: 'APPROUVE', commentaire: '' });
    setSaveError('');
  };

  const handleValider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemande) return;
    setSaving(true);
    setSaveError('');
    try {
      await workflowApi.valider(selectedDemande.id, {
        statut: validationForm.decision,
        commentaire: validationForm.commentaire || undefined,
      });
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSaveError(e?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const currentEtapeLabel = (demande: DemandeValidation): string => {
    if (!demande.etapes?.length) return `Étape ${demande.etapeActuelle}/${demande.totalEtapes}`;
    const etape = demande.etapes.find((e) => e.numeroEtape === demande.etapeActuelle);
    return etape
      ? `${etape.libelle} (${ROLES_LABEL[etape.roleRequis as UserRole] ?? etape.roleRequis})`
      : `Étape ${demande.etapeActuelle}/${demande.totalEtapes}`;
  };

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="card p-1 flex gap-1 w-fit">
        {([
          { key: 'toutes', label: 'Toutes les demandes' },
          { key: 'mes-demandes', label: 'Mes demandes à valider' },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !demandes.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucune demande trouvée</p>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'mes-demandes'
                ? 'Aucune demande ne requiert votre validation pour le moment'
                : 'Le workflow est vide pour l\'instant'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Créé par</th>
                  <th>Date</th>
                  <th>Étape actuelle</th>
                  <th>Progression</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="text-xs font-medium text-slate-600">
                        {TYPE_LABEL[d.type] ?? d.type}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 max-w-xs truncate">{d.titre}</p>
                      {d.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">{d.description}</p>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-slate-700">{d.createur?.nom ?? `#${d.createurId}`}</p>
                      {d.createur?.email && (
                        <p className="text-xs text-slate-400">{d.createur.email}</p>
                      )}
                    </td>
                    <td className="text-sm text-slate-600">{formatDate(d.createdAt)}</td>
                    <td>
                      <p className="text-xs text-slate-600 max-w-48">{currentEtapeLabel(d)}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(d.etapeActuelle / Math.max(d.totalEtapes, 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {d.etapeActuelle}/{d.totalEtapes}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUT_BADGE[d.statut]}`}>
                        {STATUT_LABEL[d.statut]}
                      </span>
                    </td>
                    <td>
                      {canValidate(d) ? (
                        <button
                          onClick={() => openValidation(d)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Valider
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Étapes détail (visible si demande est EN_COURS) */}

      {/* Modal validation */}
      {selectedDemande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Valider la demande</h2>
              <button onClick={() => setSelectedDemande(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleValider} className="p-6 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                  {saveError}
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-slate-500">Demande</p>
                <p className="font-medium text-slate-700">{selectedDemande.titre}</p>
                <p className="text-xs text-slate-400">{TYPE_LABEL[selectedDemande.type]}</p>
              </div>

              <div>
                <label className="form-label">Décision *</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setValidationForm({ ...validationForm, decision: 'APPROUVE' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      validationForm.decision === 'APPROUVE'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-500 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidationForm({ ...validationForm, decision: 'REJETE' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      validationForm.decision === 'REJETE'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeter
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">
                  Commentaire {validationForm.decision === 'REJETE' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={validationForm.commentaire}
                  onChange={(e) => setValidationForm({ ...validationForm, commentaire: e.target.value })}
                  className="form-input resize-none"
                  rows={3}
                  placeholder={validationForm.decision === 'REJETE' ? 'Motif de rejet obligatoire' : 'Commentaire optionnel'}
                  required={validationForm.decision === 'REJETE'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDemande(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 ${
                    validationForm.decision === 'REJETE'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {saving ? 'Traitement...' : validationForm.decision === 'REJETE' ? 'Rejeter' : 'Approuver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
