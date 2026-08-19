'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Home, X } from 'lucide-react';
import { pretsApi } from '@/lib/api';
import { formatFCFA, formatDate } from '@/lib/format';
import type { Pret, EcheancePret, Hypotheque, StatutPret, StatutEcheance } from '@/types';

const STATUT_PRET_BADGE: Record<StatutPret, string> = {
  ACTIF: 'badge-success',
  EN_DEFAUT: 'badge-danger',
  CLOTURE: 'badge-muted',
  RENEGOCIE: 'badge-info',
  SOLDE: 'badge-muted',
};

const STATUT_ECH_BADGE: Record<StatutEcheance, string> = {
  EN_ATTENTE: 'badge-muted',
  PAYE: 'badge-success',
  PARTIEL: 'badge-warning',
  IMPAYE: 'badge-danger',
};

const STATUT_ECH_LABEL: Record<StatutEcheance, string> = {
  EN_ATTENTE: 'En attente',
  PAYE: 'Payé',
  PARTIEL: 'Partiel',
  IMPAYE: 'Impayé',
};

interface PretDetail extends Pret {
  echeances?: EcheancePret[];
  hypotheques?: Hypotheque[];
}

const emptyPaiement = {
  montantPaye: '',
  datePaiement: new Date().toISOString().split('T')[0],
  commentaire: '',
};

export default function PretDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pret, setPret] = useState<PretDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [echeances, setEcheances] = useState<EcheancePret[]>([]);
  const [loadingEch, setLoadingEch] = useState(true);

  const [paiementEch, setPaiementEch] = useState<EcheancePret | null>(null);
  const [paiementForm, setPaiementForm] = useState(emptyPaiement);
  const [savingPaiement, setSavingPaiement] = useState(false);
  const [paiementError, setPaiementError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await pretsApi.getById(id);
        setPret(res.data);
      } catch {
        setError('Impossible de charger le prêt');
      } finally {
        setLoading(false);
      }
    };
    const loadEch = async () => {
      setLoadingEch(true);
      try {
        const res = await pretsApi.getEcheances(id);
        setEcheances(res.data?.data ?? res.data ?? []);
      } catch {
        setEcheances([]);
      } finally {
        setLoadingEch(false);
      }
    };
    load();
    loadEch();
  }, [id]);

  const openPaiement = (ech: EcheancePret) => {
    setPaiementEch(ech);
    setPaiementForm({
      montantPaye: String(ech.montantTotal - ech.montantPaye),
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: '',
    });
    setPaiementError('');
  };

  const handlePaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paiementEch) return;
    setSavingPaiement(true);
    setPaiementError('');
    try {
      await pretsApi.enregistrerPaiement(id, {
        echeanceId: paiementEch.id,
        montantPaye: parseFloat(paiementForm.montantPaye),
        datePaiement: paiementForm.datePaiement,
        commentaire: paiementForm.commentaire || undefined,
      });
      setPaiementEch(null);
      // Reload echeances
      const res = await pretsApi.getEcheances(id);
      setEcheances(res.data?.data ?? res.data ?? []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPaiementError(e?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setSavingPaiement(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pret) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 font-medium">{error || 'Prêt introuvable'}</p>
        <button
          onClick={() => router.push('/prets')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const clientName = pret.client
    ? (pret.client.typeClient === 'ENTREPRISE'
        ? (pret.client.raisonSociale ?? pret.client.nom)
        : `${pret.client.nom}${pret.client.prenom ? ' ' + pret.client.prenom : ''}`)
    : '—';

  const canPay = (statut: StatutEcheance) =>
    statut === 'EN_ATTENTE' || statut === 'PARTIEL' || statut === 'IMPAYE';

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/prets"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{pret.numeroPret}</h1>
              <p className="text-sm text-slate-500">{clientName}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUT_PRET_BADGE[pret.statut]}`}>
            {pret.statut}
          </span>
        </div>
      </div>

      {/* Infos + Garanties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Informations</h2>
          <dl className="space-y-2">
            {[
              ['Montant initial', formatFCFA(pret.montantInitial)],
              ['Restant dû', formatFCFA(pret.montantRestant)],
              ['Taux d\'intérêt', `${pret.tauxInteret?.toFixed(2)}%`],
              ['Durée', `${pret.dureeMois} mois`],
              ['Type amortissement', pret.typeAmortissement],
              ['Date début', formatDate(pret.dateDebut)],
              ['Date fin', formatDate(pret.dateFin)],
              ['Objet', pret.objet ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-2">
                <dt className="text-xs text-slate-500 flex-shrink-0">{label}</dt>
                <dd className="text-sm font-medium text-slate-700 text-right tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Garanties liées */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Garanties liées ({pret.hypotheques?.length ?? 0})
            </h2>
          </div>
          {!pret.hypotheques?.length ? (
            <p className="text-sm text-slate-400">Aucune garantie hypothécaire liée à ce prêt</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° TF</th>
                    <th>Nature</th>
                    <th>VNC</th>
                    <th>LTV</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pret.hypotheques.map((h) => (
                    <tr key={h.id}>
                      <td className="font-medium">{h.numeroTitreFoncier}</td>
                      <td className="text-sm">{h.natureBien}</td>
                      <td className="tabular-nums">{formatFCFA(h.vnc)}</td>
                      <td>
                        <span className={`font-semibold text-sm ${
                          h.ltv > 100 ? 'text-red-600' : h.ltv > 80 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {h.ltv?.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          h.statut === 'A_JOUR' ? 'badge-success'
                          : h.statut === 'SHORTFALL' ? 'badge-danger'
                          : 'badge-warning'
                        }`}>
                          {h.statut}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/hypotheques/${h.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tableau d'amortissement */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-700">Tableau d&apos;amortissement</h2>
          <p className="text-xs text-slate-500 mt-0.5">{echeances.length} échéance{echeances.length !== 1 ? 's' : ''}</p>
        </div>

        {loadingEch ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !echeances.length ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-slate-400">Aucune échéance disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Date échéance</th>
                  <th>Capital dû</th>
                  <th>Intérêts</th>
                  <th>Total</th>
                  <th>Payé</th>
                  <th>Pénalités</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {echeances.map((ech) => (
                  <tr
                    key={ech.id}
                    className={
                      ech.statut === 'IMPAYE' ? 'row-danger'
                      : ech.statut === 'PARTIEL' ? 'row-warning'
                      : ''
                    }
                  >
                    <td className="font-medium tabular-nums">{ech.numeroEcheance}</td>
                    <td className="text-sm">{formatDate(ech.dateEcheance)}</td>
                    <td className="tabular-nums text-sm">{formatFCFA(ech.capitalDu)}</td>
                    <td className="tabular-nums text-sm">{formatFCFA(ech.interetsDus)}</td>
                    <td className="tabular-nums text-sm font-medium">{formatFCFA(ech.montantTotal)}</td>
                    <td className="tabular-nums text-sm">{formatFCFA(ech.montantPaye)}</td>
                    <td className="tabular-nums text-sm">
                      {ech.penalites > 0
                        ? <span className="text-red-600">{formatFCFA(ech.penalites)}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUT_ECH_BADGE[ech.statut]}`}>
                        {STATUT_ECH_LABEL[ech.statut]}
                      </span>
                    </td>
                    <td>
                      {canPay(ech.statut) ? (
                        <button
                          onClick={() => openPaiement(ech)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Payer
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

      {/* Modal paiement */}
      {paiementEch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                Enregistrer paiement — Échéance {paiementEch.numeroEcheance}
              </h2>
              <button onClick={() => setPaiementEch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaiement} className="p-6 space-y-4">
              {paiementError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                  {paiementError}
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant total</span>
                  <span className="font-medium">{formatFCFA(paiementEch.montantTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Déjà payé</span>
                  <span className="font-medium">{formatFCFA(paiementEch.montantPaye)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-700 font-medium">Restant</span>
                  <span className="font-bold text-blue-700">{formatFCFA(paiementEch.montantTotal - paiementEch.montantPaye)}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Montant payé (FCFA) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={paiementForm.montantPaye}
                  onChange={(e) => setPaiementForm({ ...paiementForm, montantPaye: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Date de paiement *</label>
                <input
                  type="date"
                  value={paiementForm.datePaiement}
                  onChange={(e) => setPaiementForm({ ...paiementForm, datePaiement: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Commentaire</label>
                <input
                  type="text"
                  value={paiementForm.commentaire}
                  onChange={(e) => setPaiementForm({ ...paiementForm, commentaire: e.target.value })}
                  className="form-input"
                  placeholder="Optionnel"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaiementEch(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingPaiement}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-60"
                >
                  {savingPaiement ? 'Enregistrement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
