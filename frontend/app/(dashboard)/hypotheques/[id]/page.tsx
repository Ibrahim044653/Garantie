'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  MapPin,
  User,
  Calendar,
  Building2,
  AlertTriangle,
  Clock,
  X,
  TrendingUp,
} from 'lucide-react';
import { hypothequesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatFCFA,
  formatDate,
  formatPercent,
  NATURE_LABELS,
  ZONE_LABELS,
  OCCUPATION_LABELS,
  RANG_LABELS,
  ALERTE_TYPE_LABELS,
} from '@/lib/format';
import { StatusBadge, SeveriteBadge } from '@/components/shared/StatusBadge';
import dynamic from 'next/dynamic';
import type { Hypotheque, Alerte } from '@/types';

const LtvGauge = dynamic(() => import('@/components/hypotheques/LtvGauge'), { ssr: false });

interface HistoriqueEntry {
  id: number;
  action: string;
  valeurAvant?: number;
  valeurApres?: number;
  userId: number;
  userName: string;
  createdAt: string;
}

export default function HypothequePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { canEdit } = useAuth();

  const [hyp, setHyp] = useState<Hypotheque | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // Revalorisation par indice
  const [showRevalModal, setShowRevalModal] = useState(false);
  const [revalIndice, setRevalIndice] = useState('');
  const [revalMotif, setRevalMotif] = useState('');
  const [revalSaving, setRevalSaving] = useState(false);
  const [revalError, setRevalError] = useState('');

  useEffect(() => {
    hypothequesApi
      .get(id)
      .then((res) => setHyp(res.data))
      .catch(() => setHyp(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRevaloriser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevalError('');
    const indice = parseFloat(revalIndice);
    if (isNaN(indice) || indice <= 0) {
      setRevalError("L'indice doit être un nombre positif.");
      return;
    }
    if (!revalMotif.trim()) {
      setRevalError('Le motif est requis.');
      return;
    }
    setRevalSaving(true);
    try {
      const res = await hypothequesApi.revaloriser(id, { indiceRevalorisation: indice, motif: revalMotif.trim() });
      setHyp(res.data);
      setShowRevalModal(false);
      setRevalIndice('');
      setRevalMotif('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Erreur lors de la revalorisation';
      setRevalError(msg);
    } finally {
      setRevalSaving(false);
    }
  };

  const openHistorique = async () => {
    setShowHistorique(true);
    if (historique.length) return;
    setHistLoading(true);
    try {
      const res = await hypothequesApi.historique(id);
      setHistorique(res.data ?? []);
    } catch {
      setHistorique([]);
    } finally {
      setHistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hyp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">Hypothèque introuvable</p>
        <Link
          href="/hypotheques"
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const alertes = (hyp.alertes ?? []) as Alerte[];

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/hypotheques"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Hypothèques
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-sm text-slate-700 font-medium">
          {hyp.numeroTitreFoncier}
        </span>
      </div>

      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            TF {hyp.numeroTitreFoncier}
          </h2>
          <p className="text-slate-500 text-sm">{hyp.nomClient}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge statut={hyp.statut} />
          {alertes.length > 0 && (
            <span className="flex items-center gap-1 text-red-600 text-sm font-medium badge-danger px-2.5 py-0.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={openHistorique}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            <Clock className="w-4 h-4" />
            Historique
          </button>
          {canEdit() && (
            <>
              <button
                onClick={() => { setShowRevalModal(true); setRevalError(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-300 text-violet-700 rounded-lg text-sm hover:bg-violet-50"
              >
                <TrendingUp className="w-4 h-4" />
                Revaloriser
              </button>
              <Link
                href={`/hypotheques/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Alerts row */}
      {alertes.length > 0 && (
        <div className="space-y-2 mb-4">
          {alertes.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-700">
                    {ALERTE_TYPE_LABELS[a.type]}
                  </span>
                  <SeveriteBadge severite={a.severite} />
                </div>
                <p className="text-sm text-red-600 mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* LEFT — Identification */}
        <div className="card p-5 space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Identification
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="N° Titre Foncier" value={hyp.numeroTitreFoncier} />
            <InfoItem label="N° Prêt" value={hyp.numeroPret} />
            <InfoItem label="Code Client" value={hyp.codeClient} />
            <InfoItem
              label="Nature du Bien"
              value={NATURE_LABELS[hyp.natureBien] ?? hyp.natureBien}
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Client
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Nom" value={hyp.nomClient} />
              <InfoItem label="Code" value={hyp.codeClient} />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Localisation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Ville" value={hyp.ville} />
              <InfoItem label="Quartier" value={hyp.quartier} />
              {hyp.lot && <InfoItem label="Lot" value={hyp.lot} />}
              {hyp.ilot && <InfoItem label="Îlot" value={hyp.ilot} />}
              <InfoItem
                label="Zone Géographique"
                value={ZONE_LABELS[hyp.zoneGeographique]}
              />
              <InfoItem
                label="Statut Occupation"
                value={OCCUPATION_LABELS[hyp.statutOccupation]}
              />
            </div>
          </div>
        </div>

        {/* RIGHT — Valeurs calculées */}
        <div className="space-y-4">
          {/* Décotes breakdown */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">
              Calcul des Décotes (Circulaire 04-2017)
            </h3>

            <div className="space-y-2">
              <DecoteRow
                label="Décote Zone"
                zone={hyp.zoneGeographique}
                value={hyp.decoteZone}
              />
              <DecoteRow label="Décote Ancienneté" value={hyp.decoteAnciennete} />
              <DecoteRow label="Décote Occupation" value={hyp.decoteOccupation} />
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    Décote Totale
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {formatPercent(hyp.decoteTotale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <ValueRow
                label="Valeur Expertise"
                value={formatFCFA(hyp.valeurExpertiseInitiale)}
              />
              <ValueRow
                label="Date Expertise"
                value={formatDate(hyp.dateExpertise)}
                sub={
                  hyp.statut === 'EXPERTISE_OBSOLETE' ? (
                    <span className="text-xs text-red-500 font-medium">
                      Expertise obsolète
                    </span>
                  ) : null
                }
              />
              <ValueRow label="VNC" value={formatFCFA(hyp.vnc)} highlight />
            </div>
          </div>

          {/* Inscription */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Inscription Hypothécaire
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="Montant Inscription"
                value={formatFCFA(hyp.montantInscription)}
              />
              <InfoItem
                label="Rang"
                value={RANG_LABELS[hyp.rangHypotheque]}
              />
              <InfoItem
                label="Date Péremption"
                value={formatDate(hyp.datePeremptionInscription)}
              />
              <InfoItem
                label="Solde Prêt"
                value={formatFCFA(hyp.soldePret)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* LTV section */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Ratio LTV</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <LtvGauge value={hyp.ltv} size="lg" />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Valeur Expertise"
              value={formatFCFA(hyp.valeurExpertiseInitiale)}
              color="blue"
            />
            <MetricCard label="VNC" value={formatFCFA(hyp.vnc)} color="violet" />
            <MetricCard
              label="Solde Prêt"
              value={formatFCFA(hyp.soldePret)}
              color="amber"
            />
            <MetricCard
              label="LTV Ratio"
              value={formatPercent(hyp.ltv)}
              color={hyp.ltv > 100 ? 'red' : hyp.ltv > 80 ? 'amber' : 'green'}
            />
          </div>
        </div>
      </div>

      {/* Revalorisation par indice Modal */}
      {showRevalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                  Revalorisation par indice
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applique un indice de revalorisation à la valeur d&apos;expertise
                </p>
              </div>
              <button
                onClick={() => setShowRevalModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRevaloriser} className="p-5 space-y-4">
              {revalError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {revalError}
                </div>
              )}

              <div>
                <label className="form-label">Indice de revalorisation (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={revalIndice}
                  onChange={(e) => setRevalIndice(e.target.value)}
                  className="form-input"
                  placeholder="ex: 5.5"
                  disabled={revalSaving}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Pourcentage d&apos;augmentation appliqué à la valeur expertise actuelle
                </p>
              </div>

              <div>
                <label className="form-label">Motif *</label>
                <textarea
                  value={revalMotif}
                  onChange={(e) => setRevalMotif(e.target.value)}
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Ex: Revalorisation annuelle indice BCEAO 2024"
                  disabled={revalSaving}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRevalModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={revalSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:bg-violet-400"
                >
                  {revalSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  Appliquer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historique Modal/Drawer */}
      {showHistorique && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Historique — {hyp.numeroTitreFoncier}
                </h3>
                <p className="text-xs text-slate-500">
                  Toutes les modifications enregistrées
                </p>
              </div>
              <button
                onClick={() => setShowHistorique(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {histLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !historique.length ? (
                <p className="text-center text-slate-500 text-sm py-8">
                  Aucun historique disponible
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Avant</th>
                        <th>Après</th>
                        <th>Utilisateur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historique.map((h) => (
                        <tr key={h.id}>
                          <td className="text-xs">{formatDate(h.createdAt)}</td>
                          <td className="font-medium text-sm">{h.action}</td>
                          <td className="text-sm text-slate-500">
                            {h.valeurAvant !== undefined
                              ? formatFCFA(h.valeurAvant)
                              : '—'}
                          </td>
                          <td className="text-sm text-slate-800">
                            {h.valeurApres !== undefined
                              ? formatFCFA(h.valeurApres)
                              : '—'}
                          </td>
                          <td className="text-sm">{h.userName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-800 font-semibold mt-0.5">
        {value || '—'}
      </p>
    </div>
  );
}

function DecoteRow({
  label,
  value,
  zone,
}: {
  label: string;
  value: number;
  zone?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600">
        {label}
        {zone && (
          <span className="ml-1 text-xs badge-info px-1.5 py-0.5 rounded">
            Zone {zone}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold text-slate-800">
        {formatPercent(value)}
      </span>
    </div>
  );
}

function ValueRow({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span
          className={`text-sm ${highlight ? 'font-bold text-blue-700' : 'text-slate-600'}`}
        >
          {label}
        </span>
        {sub && <div>{sub}</div>}
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-blue-700' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'violet' | 'amber' | 'green' | 'red';
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-xl p-3 text-center ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
