'use client';

import { useState, useEffect, useCallback } from 'react';
import { assurancesApi } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type AssuranceType =
  | 'DECES_INVALIDITE'
  | 'INCENDIE_CATASTROPHE'
  | 'MULTIRISQUE_HABITATION'
  | 'DEFAILLANCE_CREDIT'
  | 'AUTRE';

type AssuranceStatut = 'ACTIVE' | 'EXPIREE' | 'RESILIEE' | 'EN_ATTENTE';

interface Sinistre {
  id: number;
  numeroDossier: string;
  dateSurvenance: string;
  montantDeclare: number;
  statut: string;
  description?: string;
}

interface Assurance {
  id: number;
  numeroPolice: string;
  compagnie: string;
  typeAssurance: AssuranceType;
  statut: AssuranceStatut;
  montantAssure: number;
  primeMensuelle: number;
  primeAnnuelle: number;
  dateDebut: string;
  dateFin: string;
  beneficiaire?: string;
  alerteExpiration: boolean;
  joursRestants: number;
  nomClient?: string;
  numeroPret?: string;
  sinistres: Sinistre[];
}

interface AssuranceStats {
  total: number;
  actives: number;
  expirantBientot: number;
  expirees: number;
  montantAssureTotal: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AssuranceType, string> = {
  DECES_INVALIDITE:       'Décès / Invalidité',
  INCENDIE_CATASTROPHE:   'Incendie / Catastrophe',
  MULTIRISQUE_HABITATION: 'Multirisque habitation',
  DEFAILLANCE_CREDIT:     'Défaillance crédit',
  AUTRE:                  'Autre',
};

const TYPE_BADGE: Record<AssuranceType, string> = {
  DECES_INVALIDITE:       'bg-blue-100 text-blue-700',
  INCENDIE_CATASTROPHE:   'bg-red-100 text-red-700',
  MULTIRISQUE_HABITATION: 'bg-green-100 text-green-700',
  DEFAILLANCE_CREDIT:     'bg-orange-100 text-orange-700',
  AUTRE:                  'bg-slate-100 text-slate-600',
};

const STATUT_BADGE: Record<AssuranceStatut, string> = {
  ACTIVE:     'bg-green-100 text-green-700',
  EXPIREE:    'bg-red-100 text-red-700',
  RESILIEE:   'bg-slate-100 text-slate-500',
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
};

const STATUT_LABELS: Record<AssuranceStatut, string> = {
  ACTIVE:     'Active',
  EXPIREE:    'Expirée',
  RESILIEE:   'Résiliée',
  EN_ATTENTE: 'En attente',
};

function fmtMontant(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function joursColor(jours: number): string {
  if (jours < 30) return 'text-red-600 font-semibold';
  if (jours < 60) return 'text-amber-600 font-semibold';
  return 'text-green-600';
}

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Nouvelle police modal ────────────────────────────────────────────────────

interface PoliceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function PoliceModal({ onClose, onSuccess }: PoliceModalProps) {
  const [form, setForm] = useState({
    numeroPolice: '',
    compagnie: '',
    typeAssurance: 'AUTRE' as AssuranceType,
    lierType: 'pret' as 'pret' | 'client' | 'hypotheque',
    lierId: '',
    montantAssure: '',
    primeMensuelle: '',
    primeAnnuelle: '',
    dateDebut: '',
    dateFin: '',
    beneficiaire: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        numeroPolice:  form.numeroPolice,
        compagnie:     form.compagnie,
        typeAssurance: form.typeAssurance,
        montantAssure: Number(form.montantAssure),
        primeMensuelle: Number(form.primeMensuelle),
        primeAnnuelle:  Number(form.primeAnnuelle),
        dateDebut: form.dateDebut,
        dateFin:   form.dateFin,
        beneficiaire: form.beneficiaire,
      };
      if (form.lierId) payload[`${form.lierType}Id`] = Number(form.lierId);
      await assurancesApi.create(payload);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur lors de la création. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Nouvelle police d'assurance</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">N° Police *</label>
              <input type="text" required value={form.numeroPolice} onChange={e => set('numeroPolice', e.target.value)} className={inputCls} placeholder="POL-2026-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Compagnie *</label>
              <input type="text" required value={form.compagnie} onChange={e => set('compagnie', e.target.value)} className={inputCls} placeholder="Ex: NSIA Assurances" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type d'assurance *</label>
            <select value={form.typeAssurance} onChange={e => set('typeAssurance', e.target.value)} className={inputCls}>
              {(Object.keys(TYPE_LABELS) as AssuranceType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lier à</label>
              <select value={form.lierType} onChange={e => set('lierType', e.target.value)} className={inputCls}>
                <option value="pret">Prêt</option>
                <option value="client">Client</option>
                <option value="hypotheque">Hypothèque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ID entité</label>
              <input type="number" value={form.lierId} onChange={e => set('lierId', e.target.value)} className={inputCls} placeholder="ID" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Montant assuré (F) *</label>
              <input type="number" required min={0} value={form.montantAssure} onChange={e => set('montantAssure', e.target.value)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prime mensuelle (F)</label>
              <input type="number" min={0} value={form.primeMensuelle} onChange={e => set('primeMensuelle', e.target.value)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prime annuelle (F)</label>
              <input type="number" min={0} value={form.primeAnnuelle} onChange={e => set('primeAnnuelle', e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date début *</label>
              <input type="date" required value={form.dateDebut} onChange={e => set('dateDebut', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date fin *</label>
              <input type="date" required value={form.dateFin} onChange={e => set('dateFin', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bénéficiaire</label>
            <input type="text" value={form.beneficiaire} onChange={e => set('beneficiaire', e.target.value)} className={inputCls} placeholder="Nom du bénéficiaire" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Création...' : 'Créer la police'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sinistre declaration modal ───────────────────────────────────────────────

interface SinistreModalProps {
  assuranceId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function SinistreModal({ assuranceId, onClose, onSuccess }: SinistreModalProps) {
  const [form, setForm] = useState({
    numeroDossier: '',
    dateSurvenance: '',
    montantDeclare: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await assurancesApi.createSinistre(assuranceId, {
        numeroDossier:   form.numeroDossier,
        dateSurvenance:  form.dateSurvenance,
        montantDeclare:  Number(form.montantDeclare),
        description:     form.description,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur lors de la déclaration.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Déclarer un sinistre</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">N° Dossier *</label>
            <input type="text" required value={form.numeroDossier} onChange={e => set('numeroDossier', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date de survenance *</label>
            <input type="date" required value={form.dateSurvenance} onChange={e => set('dateSurvenance', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Montant déclaré (F) *</label>
            <input type="number" required min={0} value={form.montantDeclare} onChange={e => set('montantDeclare', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Déclaration...' : 'Déclarer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssurancesPage() {
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [stats, setStats] = useState<AssuranceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'toutes' | 'alertes'>('toutes');
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Assurance | null>(null);
  const [sinistreTarget, setSinistreTarget] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {};
      if (activeTab === 'alertes') params.alerteExpiration = true;

      const [assRes, statsRes] = await Promise.all([
        assurancesApi.list(params),
        assurancesApi.stats(),
      ]);
      setAssurances(assRes.data?.data ?? assRes.data ?? []);
      setStats(statsRes.data?.data ?? statsRes.data ?? null);
    } catch {
      setError('Impossible de charger les assurances.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const alertCount = assurances.filter(a => a.alerteExpiration).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Module Assurances</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Polices d'assurance · Alertes d'expiration · Suivi des sinistres
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          + Nouvelle police
        </button>
      </div>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-3 text-sm">
          <span className="text-amber-500 text-lg">⚠</span>
          <span>
            <strong>{alertCount} police{alertCount > 1 ? 's' : ''}</strong> arrive{alertCount > 1 ? 'nt' : ''} à expiration dans moins de 60 jours.{' '}
            <button
              onClick={() => setActiveTab('alertes')}
              className="underline font-medium hover:text-amber-900"
            >
              Voir les alertes
            </button>
          </span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total polices</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Actives</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.actives}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold">Expirant bientôt</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.expirantBientot}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <p className="text-xs text-red-500 uppercase tracking-wide font-semibold">Expirées</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.expirees}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Montant assuré total</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {(stats.montantAssureTotal / 1e6).toFixed(1)} M
            </p>
            <p className="text-xs text-slate-400">FCFA</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['toutes', 'alertes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'toutes' ? 'Toutes les polices' : 'Alertes d\'expiration'}
            {tab === 'alertes' && alertCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : loading ? (
          <Spinner />
        ) : assurances.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Aucune police trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-semibold">N° Police</th>
                  <th className="text-left px-4 py-3 font-semibold">Compagnie</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Client / Prêt</th>
                  <th className="text-right px-4 py-3 font-semibold">Montant assuré</th>
                  <th className="text-right px-4 py-3 font-semibold">Prime mens.</th>
                  <th className="text-left px-4 py-3 font-semibold">Date fin</th>
                  <th className="text-center px-4 py-3 font-semibold">Jours rest.</th>
                  <th className="text-center px-4 py-3 font-semibold">Statut</th>
                  <th className="text-center px-4 py-3 font-semibold">Sinistres</th>
                  <th className="text-center px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assurances.map(a => (
                  <>
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRow(prev => prev?.id === a.id ? null : a)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.numeroPolice}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{a.compagnie}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[a.typeAssurance]}`}>
                          {TYPE_LABELS[a.typeAssurance]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.nomClient || a.numeroPret || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtMontant(a.montantAssure)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{a.primeMensuelle ? fmtMontant(a.primeMensuelle) : '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(a.dateFin)}</td>
                      <td className={`px-4 py-3 text-center text-xs ${joursColor(a.joursRestants)}`}>
                        {a.joursRestants > 0 ? `${a.joursRestants}j` : 'Expirée'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[a.statut]}`}>
                          {STATUT_LABELS[a.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.sinistres?.length > 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            {a.sinistres.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={ev => { ev.stopPropagation(); setSinistreTarget(a.id); }}
                          className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                        >
                          + Sinistre
                        </button>
                      </td>
                    </tr>

                    {/* Detail panel */}
                    {selectedRow?.id === a.id && (
                      <tr key={`detail-${a.id}`}>
                        <td colSpan={11} className="bg-slate-50 px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-slate-700">
                                Sinistres — {a.numeroPolice}
                              </h3>
                              <button
                                onClick={() => setSinistreTarget(a.id)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                              >
                                Déclarer sinistre
                              </button>
                            </div>
                            {a.sinistres?.length === 0 ? (
                              <p className="text-xs text-slate-400">Aucun sinistre déclaré.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-500 uppercase text-left border-b border-slate-200">
                                    <th className="pb-1 pr-4 font-semibold">N° Dossier</th>
                                    <th className="pb-1 pr-4 font-semibold">Date</th>
                                    <th className="pb-1 pr-4 font-semibold">Montant déclaré</th>
                                    <th className="pb-1 font-semibold">Statut</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {a.sinistres.map(s => (
                                    <tr key={s.id}>
                                      <td className="py-1.5 pr-4 font-mono">{s.numeroDossier}</td>
                                      <td className="py-1.5 pr-4">{fmtDate(s.dateSurvenance)}</td>
                                      <td className="py-1.5 pr-4">{fmtMontant(s.montantDeclare)}</td>
                                      <td className="py-1.5">
                                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">{s.statut}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <PoliceModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}

      {sinistreTarget !== null && (
        <SinistreModal
          assuranceId={sinistreTarget}
          onClose={() => setSinistreTarget(null)}
          onSuccess={() => { setSinistreTarget(null); fetchData(); }}
        />
      )}
    </div>
  );
}
