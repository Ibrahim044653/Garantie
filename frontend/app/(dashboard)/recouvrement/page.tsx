'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertOctagon,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/lib/api';
import { formatFCFA, formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatutRecouvrement = 'PRE_CONTENTIEUX' | 'CONTENTIEUX' | 'JUDICIAIRE' | 'CLOTURE';
type PeriodeEcheance = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';
type StatutEcheance = 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD';

interface Echeance {
  id: number;
  numero: number;
  dateEcheance: string;
  montant: number;
  statut: StatutEcheance;
  montantPaye?: number;
  datePaiement?: string;
}

interface PlanApurement {
  id: number;
  dateDebut: string;
  montantTotal: number;
  nombreEcheances: number;
  periodeEcheance: PeriodeEcheance;
  tauxPenalite?: number;
  echeances: Echeance[];
}

interface DossierRecouvrement {
  id: number;
  pretId: number;
  pret: {
    numeroPret: string;
    client: { nom: string; codeClient: string };
  };
  statut: StatutRecouvrement;
  montantDu: number;
  montantPenalites?: number;
  observations?: string;
  planApurement?: PlanApurement;
}

interface RecouvrementStats {
  totalDossiers: number;
  parStatut: Record<string, number>;
  montantDuTotal: number;
  tauxRecouvrement: number;
}

interface PretSummary {
  id: number;
  numeroPret: string;
  client?: { nom?: string };
  nomClient?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<StatutRecouvrement, { label: string; color: string }> = {
  PRE_CONTENTIEUX: { label: 'Pré-contentieux', color: 'bg-amber-100 text-amber-700' },
  CONTENTIEUX: { label: 'Contentieux', color: 'bg-orange-100 text-orange-700' },
  JUDICIAIRE: { label: 'Judiciaire', color: 'bg-red-100 text-red-700' },
  CLOTURE: { label: 'Clôturé', color: 'bg-green-100 text-green-700' },
};

const STATUT_ECHEANCE_CONFIG: Record<StatutEcheance, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-slate-100 text-slate-600' },
  PAYE: { label: 'Payé', color: 'bg-green-100 text-green-700' },
  EN_RETARD: { label: 'En retard', color: 'bg-red-100 text-red-700' },
};

const PAGE_SIZE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: StatutRecouvrement }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Modal Création ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [prets, setPrets] = useState<PretSummary[]>([]);
  const [pretId, setPretId] = useState('');
  const [montantDu, setMontantDu] = useState('');
  const [montantPenalites, setMontantPenalites] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/prets', { params: { statut: 'EN_DEFAUT', limit: 100 } })
      .then((r) => setPrets(r.data.data ?? r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pretId || !montantDu) { setError('Prêt et montant dû sont requis'); return; }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/recouvrement', {
        pretId: Number(pretId),
        montantDu: Number(montantDu),
        montantPenalites: montantPenalites ? Number(montantPenalites) : undefined,
        observations: observations || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Nouveau dossier de recouvrement</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prêt en défaut *</label>
            <select value={pretId} onChange={(e) => setPretId(e.target.value)} className="form-input w-full" required>
              <option value="">Sélectionner un prêt…</option>
              {prets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroPret} — {p.client?.nom ?? p.nomClient ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant dû (FCFA) *</label>
              <input type="number" value={montantDu} onChange={(e) => setMontantDu(e.target.value)} className="form-input w-full" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pénalités (FCFA)</label>
              <input type="number" value={montantPenalites} onChange={(e) => setMontantPenalites(e.target.value)} className="form-input w-full" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observations</label>
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="form-input w-full" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Paiement ─────────────────────────────────────────────────────────────

function PaiementModal({
  echeanceId,
  onClose,
  onPaid,
}: {
  echeanceId: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [montantPaye, setMontantPaye] = useState('');
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montantPaye) { setError('Montant requis'); return; }
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`/recouvrement/echeances/${echeanceId}/paiement`, {
        montantPaye: Number(montantPaye),
        datePaiement,
      });
      onPaid();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant payé (FCFA) *</label>
            <input type="number" value={montantPaye} onChange={(e) => setMontantPaye(e.target.value)} className="form-input w-full" min="0" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date de paiement</label>
            <input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} className="form-input w-full" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Slide-over Détail ──────────────────────────────────────────────────────────

function DetailPanel({
  dossier,
  onClose,
  onRefresh,
}: {
  dossier: DossierRecouvrement;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [dateDebut, setDateDebut] = useState('');
  const [montantTotal, setMontantTotal] = useState('');
  const [nombreEcheances, setNombreEcheances] = useState('12');
  const [periodeEcheance, setPeriodeEcheance] = useState<PeriodeEcheance>('MENSUEL');
  const [tauxPenalite, setTauxPenalite] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState('');
  const [paiementEcheanceId, setPaiementEcheanceId] = useState<number | null>(null);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSaving(true);
    setPlanError('');
    try {
      await apiClient.post(`/recouvrement/${dossier.id}/plan`, {
        dateDebut,
        montantTotal: Number(montantTotal),
        nombreEcheances: Number(nombreEcheances),
        periodeEcheance,
        tauxPenalite: tauxPenalite ? Number(tauxPenalite) : undefined,
      });
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPlanError(msg ?? 'Erreur lors de la création du plan');
    } finally {
      setPlanSaving(false);
    }
  };

  const plan = dossier.planApurement;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Dossier #{dossier.id}</h2>
            <p className="text-sm text-slate-500">{dossier.pret.client.nom} — {dossier.pret.numeroPret}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Infos dossier */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Informations du dossier</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Statut</p>
                <StatutBadge statut={dossier.statut} />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Montant dû</p>
                <p className="font-semibold text-slate-800">{formatFCFA(dossier.montantDu)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Pénalités</p>
                <p className="font-medium text-slate-700">{formatFCFA(dossier.montantPenalites ?? 0)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Client</p>
                <p className="font-medium text-slate-700">{dossier.pret.client.codeClient}</p>
              </div>
            </div>
          </section>

          {/* Plan d'apurement */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Plan d&apos;apurement</h3>
            {plan ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="font-medium">Début :</span> {formatDate(plan.dateDebut)}</div>
                    <div><span className="font-medium">Montant total :</span> {formatFCFA(plan.montantTotal)}</div>
                    <div><span className="font-medium">Nombre d&apos;échéances :</span> {plan.nombreEcheances}</div>
                    <div><span className="font-medium">Période :</span> {plan.periodeEcheance}</div>
                    {plan.tauxPenalite && (
                      <div><span className="font-medium">Taux pénalité :</span> {plan.tauxPenalite}%</div>
                    )}
                  </div>
                </div>

                {/* Échéances */}
                {plan.echeances?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 text-xs font-medium text-slate-500">#</th>
                          <th className="text-left py-2 text-xs font-medium text-slate-500">Date</th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500">Montant</th>
                          <th className="text-center py-2 text-xs font-medium text-slate-500">Statut</th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.echeances.map((ech) => {
                          const cfg = STATUT_ECHEANCE_CONFIG[ech.statut] ?? { label: ech.statut, color: 'bg-slate-100 text-slate-600' };
                          const canPay = ech.statut === 'EN_ATTENTE' || ech.statut === 'EN_RETARD';
                          return (
                            <tr key={ech.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 text-slate-500">{ech.numero}</td>
                              <td className="py-2">{formatDate(ech.dateEcheance)}</td>
                              <td className="py-2 text-right tabular-nums">{formatFCFA(ech.montant)}</td>
                              <td className="py-2 text-center">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                {canPay && (
                                  <button
                                    onClick={() => setPaiementEcheanceId(ech.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Payer
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreatePlan} className="space-y-3 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-500">Aucun plan d&apos;apurement défini. Créez-en un :</p>
                {planError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{planError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date de début *</label>
                    <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="form-input w-full text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Montant total (FCFA) *</label>
                    <input type="number" value={montantTotal} onChange={(e) => setMontantTotal(e.target.value)} className="form-input w-full text-sm" min="0" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre d&apos;échéances *</label>
                    <input type="number" value={nombreEcheances} onChange={(e) => setNombreEcheances(e.target.value)} className="form-input w-full text-sm" min="1" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Période</label>
                    <select value={periodeEcheance} onChange={(e) => setPeriodeEcheance(e.target.value as PeriodeEcheance)} className="form-input w-full text-sm">
                      <option value="MENSUEL">Mensuel</option>
                      <option value="TRIMESTRIEL">Trimestriel</option>
                      <option value="SEMESTRIEL">Semestriel</option>
                      <option value="ANNUEL">Annuel</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Taux de pénalité (%)</label>
                    <input type="number" value={tauxPenalite} onChange={(e) => setTauxPenalite(e.target.value)} className="form-input w-full text-sm" min="0" step="0.01" />
                  </div>
                </div>
                <button type="submit" disabled={planSaving} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {planSaving ? 'Création…' : 'Créer le plan d\'apurement'}
                </button>
              </form>
            )}
          </section>
        </div>
      </aside>

      {paiementEcheanceId && (
        <PaiementModal
          echeanceId={paiementEcheanceId}
          onClose={() => setPaiementEcheanceId(null)}
          onPaid={() => { setPaiementEcheanceId(null); onRefresh(); }}
        />
      )}
    </>
  );
}

// ── Onglet Statistiques ────────────────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState<RecouvrementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/recouvrement/stats')
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-slate-500 text-center py-12">Impossible de charger les statistiques.</p>;
  }

  const barData = Object.entries(stats.parStatut ?? {}).map(([statut, count]) => ({
    name: STATUT_CONFIG[statut as StatutRecouvrement]?.label ?? statut,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total dossiers</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalDossiers}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant total dû</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatFCFA(stats.montantDuTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taux de recouvrement</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.tauxRecouvrement?.toFixed(1)}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dossiers judiciaires</p>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.parStatut?.JUDICIAIRE ?? 0}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Répartition par statut</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Dossiers']} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RecouvrementPage() {
  const [activeTab, setActiveTab] = useState<'dossiers' | 'stats'>('dossiers');
  const [data, setData] = useState<{ data: DossierRecouvrement[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierRecouvrement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recouvrement', { params: { page, limit: PAGE_SIZE } });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (activeTab === 'dossiers') fetchData();
  }, [activeTab, fetchData]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-slate-800">Recouvrement</h1>
        </div>
        {activeTab === 'dossiers' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { key: 'dossiers', label: 'Dossiers' },
          { key: 'stats', label: 'Statistiques' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as 'dossiers' | 'stats')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' ? (
        <StatsTab />
      ) : (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertOctagon className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">Aucun dossier de recouvrement</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Prêt</th>
                      <th>Statut</th>
                      <th className="text-right">Montant dû</th>
                      <th className="text-right">Pénalités</th>
                      <th>Plan d&apos;apurement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td>
                          <div>
                            <p className="font-medium text-slate-800">{d.pret.client.nom}</p>
                            <p className="text-xs text-slate-400">{d.pret.client.codeClient}</p>
                          </div>
                        </td>
                        <td className="text-sm text-slate-600">{d.pret.numeroPret}</td>
                        <td><StatutBadge statut={d.statut} /></td>
                        <td className="text-right font-medium tabular-nums text-red-600">{formatFCFA(d.montantDu)}</td>
                        <td className="text-right tabular-nums text-slate-600">{formatFCFA(d.montantPenalites ?? 0)}</td>
                        <td className="text-sm">
                          {d.planApurement ? (
                            <span className="text-green-600 font-medium">
                              {d.planApurement.nombreEcheances} éch. / {d.planApurement.periodeEcheance}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedDossier(d)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Voir détail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-600">
                  {data.total} dossier{data.total !== 1 ? 's' : ''} — Page {data.page} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchData} />}
      {selectedDossier && (
        <DetailPanel
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onRefresh={() => { fetchData(); setSelectedDossier(null); }}
        />
      )}
    </div>
  );
}
