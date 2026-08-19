'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatutMainlevee =
  | 'EN_PREPARATION'
  | 'EN_ATTENTE_NOTAIRE'
  | 'EN_ATTENTE_CONSERVATION'
  | 'COMPLETE'
  | 'REJETE';

interface Mainlevee {
  id: number;
  hypothequeId: number;
  hypotheque: {
    nomClient: string;
    numeroPret: string;
    numeroTitreFoncier: string;
    ville?: string;
    quartier?: string;
    valeurExpertiseInitiale?: number;
  };
  statut: StatutMainlevee;
  motif: string;
  observations?: string;
  dateInitiation: string;
  dateRadiation?: string;
  referenceNotaire?: string;
  dateNotaire?: string;
  referenceConservation?: string;
  dateConservationFonciere?: string;
  createdBy: { nom: string; prenom: string };
}

interface HypothequeSummary {
  id: number;
  nomClient: string;
  numeroPret: string;
  numeroTitreFoncier: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<
  StatutMainlevee,
  { label: string; color: string }
> = {
  EN_PREPARATION: { label: 'En préparation', color: 'bg-slate-100 text-slate-700' },
  EN_ATTENTE_NOTAIRE: { label: 'Attente notaire', color: 'bg-amber-100 text-amber-700' },
  EN_ATTENTE_CONSERVATION: { label: 'Attente conservation', color: 'bg-orange-100 text-orange-700' },
  COMPLETE: { label: 'Complète', color: 'bg-green-100 text-green-700' },
  REJETE: { label: 'Rejetée', color: 'bg-red-100 text-red-700' },
};

const MOTIF_OPTIONS = [
  'Remboursement intégral',
  'Restructuration',
  'Décision judiciaire',
  'Autre',
];

const STATUT_STEPS: StatutMainlevee[] = [
  'EN_PREPARATION',
  'EN_ATTENTE_NOTAIRE',
  'EN_ATTENTE_CONSERVATION',
  'COMPLETE',
];

const NEXT_STATUT: Partial<Record<StatutMainlevee, StatutMainlevee>> = {
  EN_PREPARATION: 'EN_ATTENTE_NOTAIRE',
  EN_ATTENTE_NOTAIRE: 'EN_ATTENTE_CONSERVATION',
  EN_ATTENTE_CONSERVATION: 'COMPLETE',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: StatutMainlevee }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function WorkflowStepper({ statut }: { statut: StatutMainlevee }) {
  const currentIdx = STATUT_STEPS.indexOf(statut);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUT_STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const cfg = STATUT_CONFIG[s];
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                active
                  ? 'bg-blue-600 text-white'
                  : done
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done && <span>✓</span>}
              {cfg.label}
            </div>
            {i < STATUT_STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${done || active ? 'bg-blue-300' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal Création ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [hypotheques, setHypotheques] = useState<HypothequeSummary[]>([]);
  const [hypothequeId, setHypothequeId] = useState('');
  const [motif, setMotif] = useState(MOTIF_OPTIONS[0]);
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/hypotheques', { params: { limit: 100 } })
      .then((r) => setHypotheques(r.data.data ?? r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hypothequeId) { setError('Veuillez sélectionner une hypothèque'); return; }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/mainlevees', {
        hypothequeId: Number(hypothequeId),
        motif,
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
          <h2 className="text-lg font-semibold text-slate-800">Nouvelle mainlevée</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hypothèque *</label>
            <select
              value={hypothequeId}
              onChange={(e) => setHypothequeId(e.target.value)}
              className="form-input w-full"
              required
            >
              <option value="">Sélectionner une hypothèque…</option>
              {hypotheques.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nomClient} — {h.numeroPret} (TF: {h.numeroTitreFoncier})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motif *</label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="form-input w-full"
            >
              {MOTIF_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observations</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="form-input w-full"
              rows={3}
              placeholder="Observations complémentaires…"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Transition ───────────────────────────────────────────────────────────

interface TransitionModalProps {
  mainlevee: Mainlevee;
  nextStatut: StatutMainlevee;
  onClose: () => void;
  onUpdated: () => void;
}

function TransitionModal({ mainlevee, nextStatut, onClose, onUpdated }: TransitionModalProps) {
  const [referenceNotaire, setReferenceNotaire] = useState(mainlevee.referenceNotaire ?? '');
  const [dateNotaire, setDateNotaire] = useState(mainlevee.dateNotaire?.slice(0, 10) ?? '');
  const [referenceConservation, setReferenceConservation] = useState(mainlevee.referenceConservation ?? '');
  const [dateConservationFonciere, setDateConservationFonciere] = useState(mainlevee.dateConservationFonciere?.slice(0, 10) ?? '');
  const [dateRadiation, setDateRadiation] = useState(mainlevee.dateRadiation?.slice(0, 10) ?? '');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cfg = STATUT_CONFIG[nextStatut];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { statut: nextStatut, observations: observations || undefined };
      if (nextStatut === 'EN_ATTENTE_NOTAIRE' || nextStatut === 'EN_ATTENTE_CONSERVATION' || nextStatut === 'COMPLETE') {
        if (referenceNotaire) body.referenceNotaire = referenceNotaire;
        if (dateNotaire) body.dateNotaire = dateNotaire;
      }
      if (nextStatut === 'EN_ATTENTE_CONSERVATION' || nextStatut === 'COMPLETE') {
        if (referenceConservation) body.referenceConservation = referenceConservation;
        if (dateConservationFonciere) body.dateConservationFonciere = dateConservationFonciere;
      }
      if (nextStatut === 'COMPLETE') {
        if (dateRadiation) body.dateRadiation = dateRadiation;
      }
      await apiClient.put(`/mainlevees/${mainlevee.id}/statut`, body);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Passer à l&apos;étape suivante</h2>
            <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
          )}
          {(nextStatut === 'EN_ATTENTE_NOTAIRE' || nextStatut === 'EN_ATTENTE_CONSERVATION' || nextStatut === 'COMPLETE') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Référence notaire</label>
                <input type="text" value={referenceNotaire} onChange={(e) => setReferenceNotaire(e.target.value)} className="form-input w-full" placeholder="REF-NOT-…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date notaire</label>
                <input type="date" value={dateNotaire} onChange={(e) => setDateNotaire(e.target.value)} className="form-input w-full" />
              </div>
            </div>
          )}
          {(nextStatut === 'EN_ATTENTE_CONSERVATION' || nextStatut === 'COMPLETE') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Réf. Conservation Foncière</label>
                <input type="text" value={referenceConservation} onChange={(e) => setReferenceConservation(e.target.value)} className="form-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Conservation Foncière</label>
                <input type="date" value={dateConservationFonciere} onChange={(e) => setDateConservationFonciere(e.target.value)} className="form-input w-full" />
              </div>
            </div>
          )}
          {nextStatut === 'COMPLETE' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de radiation</label>
              <input type="date" value={dateRadiation} onChange={(e) => setDateRadiation(e.target.value)} className="form-input w-full" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observations</label>
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="form-input w-full" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Mise à jour…' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PDF Generation ─────────────────────────────────────────────────────────────

async function generateActePdf(id: number) {
  const res = await apiClient.get(`/mainlevees/${id}/acte-pdf`);
  const { mainlevee, hypotheque, client, pret } = res.data;

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const W = 210;
  const margin = 20;
  let y = 20;

  const line = (text: string, size = 11, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    if (align === 'center') {
      doc.text(text, W / 2, y, { align: 'center' });
    } else {
      doc.text(text, margin, y);
    }
    y += size * 0.5 + 2;
  };

  const skip = (mm = 6) => { y += mm; };

  line('ACTE DE MAINLEVÉE HYPOTHÉCAIRE', 16, 'bold', 'center');
  skip(4);
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y);
  skip(8);

  line(`BANQUE : Banque Sénégalaise de Garanties Hypothécaires`, 11, 'bold');
  line(`Date : ${mainlevee?.dateRadiation ? new Date(mainlevee.dateRadiation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}`);
  skip();

  line('ENTRE LES SOUSSIGNÉS :', 11, 'bold');
  skip(2);
  line(`LA BANQUE : Banque Sénégalaise de Garanties Hypothécaires,`);
  line(`ci-après dénommée "le Créancier"`);
  skip(4);
  line('ET');
  skip(4);
  line(`${client?.nom ?? hypotheque?.nomClient ?? '—'},`, 11, 'bold');
  line(`ci-après dénommé "le Débiteur"`);
  skip(8);

  line('EXPOSÉ DES FAITS', 12, 'bold');
  skip(2);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const expose = [
    `Le Créancier a consenti un prêt au Débiteur, référencé sous le numéro ${pret?.numeroPret ?? hypotheque?.numeroPret ?? '—'},`,
    `garanti par une hypothèque inscrite sur le bien immobilier situé à`,
    `${hypotheque?.ville ?? '—'}, ${hypotheque?.quartier ?? '—'},`,
    `titre foncier N° ${hypotheque?.numeroTitreFoncier ?? '—'},`,
    `valeur initiale ${hypotheque?.valeurExpertiseInitiale ? new Intl.NumberFormat('fr-FR').format(hypotheque.valeurExpertiseInitiale) + ' FCFA' : '—'}.`,
    '',
    `Le Débiteur ayant satisfait à l'ensemble de ses obligations contractuelles,`,
    `le Créancier consent à la mainlevée et radiation de ladite hypothèque.`,
  ];
  expose.forEach((l) => {
    if (l === '') { skip(3); return; }
    doc.text(l, margin, y);
    y += 6;
  });
  skip(6);

  line('MAINLEVÉE ET RADIATION', 12, 'bold');
  skip(2);
  const mainleveeText = [
    `Le Créancier renonce à l'hypothèque inscrite et autorise la radiation de la`,
    `sûreté auprès de la Conservation Foncière compétente.`,
  ];
  mainleveeText.forEach((l) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(l, margin, y);
    y += 6;
  });
  skip(6);

  line(`Référence notaire : ${mainlevee?.referenceNotaire ?? '—'}`);
  line(`Référence Conservation Foncière : ${mainlevee?.referenceConservation ?? '—'}`);
  skip(10);

  const dateStr = new Date().toLocaleDateString('fr-FR');
  line(`Fait à Dakar, le ${dateStr}`, 11, 'normal', 'center');
  skip(16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE DU CRÉANCIER', margin, y);
  doc.text('SIGNATURE DU DÉBITEUR', W - margin - 60, y);
  y += 25;
  doc.setFont('helvetica', 'normal');
  doc.text('_____________________', margin, y);
  doc.text('_____________________', W - margin - 60, y);

  doc.save(`acte-mainlevee-${hypotheque?.numeroTitreFoncier ?? id}.pdf`);
}

// ── Row ────────────────────────────────────────────────────────────────────────

interface RowProps {
  m: Mainlevee;
  onRefresh: () => void;
}

function MainleveeRow({ m, onRefresh }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const nextStatut = NEXT_STATUT[m.statut];

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await generateActePdf(m.id);
    } catch {
      alert('Erreur lors de la génération du PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="font-medium text-blue-700">{m.hypotheque.numeroTitreFoncier}</td>
        <td>{m.hypotheque.nomClient}</td>
        <td className="text-slate-600 text-sm">{m.motif}</td>
        <td><StatutBadge statut={m.statut} /></td>
        <td className="text-slate-600 text-sm">{formatDate(m.dateInitiation)}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {nextStatut && (
              <button
                onClick={() => setShowTransition(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Étape suivante
              </button>
            )}
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              {pdfLoading ? '…' : 'Acte PDF'}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-slate-50 border-b border-slate-200 px-4 py-3">
            <div className="space-y-3">
              <WorkflowStepper statut={m.statut} />
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mt-2">
                <div>
                  <span className="font-medium">Prêt :</span> {m.hypotheque.numeroPret}
                </div>
                <div>
                  <span className="font-medium">Initié par :</span>{' '}
                  {m.createdBy.prenom} {m.createdBy.nom}
                </div>
                {m.referenceNotaire && (
                  <div>
                    <span className="font-medium">Réf. Notaire :</span> {m.referenceNotaire}
                    {m.dateNotaire && ` (${formatDate(m.dateNotaire)})`}
                  </div>
                )}
                {m.referenceConservation && (
                  <div>
                    <span className="font-medium">Réf. Conservation :</span> {m.referenceConservation}
                    {m.dateConservationFonciere && ` (${formatDate(m.dateConservationFonciere)})`}
                  </div>
                )}
                {m.dateRadiation && (
                  <div>
                    <span className="font-medium">Date radiation :</span> {formatDate(m.dateRadiation)}
                  </div>
                )}
                {m.observations && (
                  <div className="col-span-2">
                    <span className="font-medium">Observations :</span> {m.observations}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
      {showTransition && nextStatut && (
        <TransitionModal
          mainlevee={m}
          nextStatut={nextStatut}
          onClose={() => setShowTransition(false)}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function MainleveesPage() {
  const [data, setData] = useState<{ data: Mainlevee[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/mainlevees', {
        params: { page, limit: PAGE_SIZE, statut: statutFilter || undefined },
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Unlock className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Mainlevées & Radiations</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle mainlevée
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-slate-600">Filtrer par statut :</span>
          {['', ...Object.keys(STATUT_CONFIG)].map((s) => (
            <button
              key={s}
              onClick={() => { setStatutFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statutFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === '' ? 'Tous' : STATUT_CONFIG[s as StatutMainlevee].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Unlock className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucune mainlevée trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Titre Foncier</th>
                    <th>Client</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Date initiation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((m) => (
                    <MainleveeRow key={m.id} m={m} onRefresh={fetchData} />
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
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchData} />
      )}
    </div>
  );
}
