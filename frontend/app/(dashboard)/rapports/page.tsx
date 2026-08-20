'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { hypothequesApi, biApi, apiClient } from '@/lib/api';
import type { BCEAOReportData, BIReportData } from '@/lib/pdf-export';
import type { Hypotheque } from '@/types';

// ─── Types locaux ──────────────────────────────────────────────────────────────

interface ExportPlanifie {
  id: number;
  type: 'BCEAO' | 'COMITE' | 'FICHE';
  frequence: 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL';
  destinataires: string[];
  prochainExport?: string;
  statut: 'ACTIF' | 'INACTIF';
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-2.5 rounded-xl ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Page Rapports ────────────────────────────────────────────────────────────

export default function RapportsPage() {
  // États fiche hypothèque
  const [ficheId, setFicheId] = useState('');
  const [ficheLoading, setFicheLoading] = useState(false);

  // États BCEAO
  const [bceaoLoading, setBceaoLoading] = useState(false);

  // États Comité
  const [comiteLoading, setComiteLoading] = useState(false);

  // Exports planifiés
  const [exportsPlanifies, setExportsPlanifies] = useState<ExportPlanifie[]>([]);
  const [exportsLoading, setExportsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planType, setPlanType] = useState<'BCEAO' | 'COMITE' | 'FICHE'>('BCEAO');
  const [planFrequence, setPlanFrequence] = useState<'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'>('MENSUEL');
  const [planDestinataires, setPlanDestinataires] = useState('');
  const [planSaving, setPlanSaving] = useState(false);

  useEffect(() => {
    loadExportsPlanifies();
  }, []);

  async function loadExportsPlanifies() {
    setExportsLoading(true);
    try {
      const res = await apiClient.get('/exports-planifies');
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
      // destinataires peut être une chaîne JSON (stockée en DB) — on parse si besoin
      setExportsPlanifies(list.map((ep: ExportPlanifie & { destinataires: string | string[] }) => ({
        ...ep,
        destinataires: Array.isArray(ep.destinataires)
          ? ep.destinataires
          : (() => { try { return JSON.parse(ep.destinataires as string); } catch { return []; } })(),
      })));
    } catch {
      setExportsPlanifies([]);
    } finally {
      setExportsLoading(false);
    }
  }

  // ── Fiche hypothèque ────────────────────────────────────────────────────────

  async function handleFicheExport(e: React.FormEvent) {
    e.preventDefault();
    if (!ficheId.trim()) return;
    setFicheLoading(true);
    try {
      const { exportHypothequeSheet } = await import('@/lib/pdf-export');
      const res = await hypothequesApi.get(ficheId.trim());
      const hyp: Hypotheque = res.data;
      await exportHypothequeSheet(hyp, hyp.alertes ?? []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error).message ??
        'Erreur inconnue';
      alert('Erreur: ' + msg);
    } finally {
      setFicheLoading(false);
    }
  }

  // ── Rapport BCEAO ───────────────────────────────────────────────────────────

  async function handleBCEAOExport() {
    setBceaoLoading(true);
    try {
      const { exportBCEAOReport } = await import('@/lib/pdf-export');
      const res = await apiClient.get('/reporting-bceao/ratios');
      await exportBCEAOReport(res.data as BCEAOReportData);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error).message ??
        'Erreur inconnue';
      alert('Erreur: ' + msg);
    } finally {
      setBceaoLoading(false);
    }
  }

  // ── Rapport Comité ──────────────────────────────────────────────────────────

  async function handleComiteExport() {
    setComiteLoading(true);
    try {
      const { exportComiteReport } = await import('@/lib/pdf-export');
      const [biRes, hypRes] = await Promise.all([
        biApi.overview(),
        hypothequesApi.list({ limit: 1000 }),
      ]);
      const biData = biRes.data as BIReportData;
      const hypotheques: Hypotheque[] = (hypRes.data as { data?: Hypotheque[] }).data ?? (hypRes.data as Hypotheque[]) ?? [];
      await exportComiteReport(biData, hypotheques);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error).message ??
        'Erreur inconnue';
      alert('Erreur: ' + msg);
    } finally {
      setComiteLoading(false);
    }
  }

  // ── Planifier un export ─────────────────────────────────────────────────────

  async function handlePlanifier(e: React.FormEvent) {
    e.preventDefault();
    const emails = planDestinataires
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      alert('Veuillez renseigner au moins un destinataire.');
      return;
    }
    setPlanSaving(true);
    try {
      await apiClient.post('/exports-planifies', {
        type: planType,
        frequence: planFrequence,
        destinataires: emails,
      });
      setShowPlanModal(false);
      setPlanDestinataires('');
      await loadExportsPlanifies();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error).message ??
        'Erreur inconnue';
      alert('Erreur: ' + msg);
    } finally {
      setPlanSaving(false);
    }
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  const TYPE_LABELS: Record<string, string> = {
    BCEAO: 'Rapport BCEAO',
    COMITE: 'Rapport Comité',
    FICHE: 'Fiche Hypothèque',
  };

  const FREQ_LABELS: Record<string, string> = {
    QUOTIDIEN: 'Quotidien',
    HEBDOMADAIRE: 'Hebdomadaire',
    MENSUEL: 'Mensuel',
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Rapports PDF</h1>
        <p className="text-slate-500 text-sm mt-1">
          Générez et planifiez vos exports de rapports réglementaires et de gestion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* ── Carte 1 : Fiche Hypothèque ─────────────────────────────────── */}
        <SectionCard
          title="Fiche Hypothèque"
          description="Générer une fiche PDF complète pour une hypothèque individuelle."
          icon={FileText}
          iconColor="bg-blue-100 text-blue-700"
        >
          <form onSubmit={handleFicheExport} className="space-y-3">
            <div>
              <label className="form-label">N° Titre Foncier ou ID</label>
              <input
                type="text"
                value={ficheId}
                onChange={(e) => setFicheId(e.target.value)}
                className="form-input"
                placeholder="ex: TF-2024-001 ou 42"
                disabled={ficheLoading}
              />
            </div>
            <button
              type="submit"
              disabled={ficheLoading || !ficheId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ficheLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {ficheLoading ? 'Génération…' : 'Générer PDF'}
            </button>
          </form>
        </SectionCard>

        {/* ── Carte 2 : Rapport BCEAO ────────────────────────────────────── */}
        <SectionCard
          title="Rapport BCEAO"
          description="Rapport réglementaire complet conformément à la Circulaire 04-2017 (portefeuille, grands risques, SYSCOHADA, ratios prudentiels)."
          icon={FileText}
          iconColor="bg-emerald-100 text-emerald-700"
        >
          <div className="space-y-3">
            <ul className="text-xs text-slate-500 space-y-1 pl-3 list-disc">
              <li>Portefeuille global (encours, VNC, taux couverture)</li>
              <li>Grands risques et dépassements de seuil</li>
              <li>État SYSCOHADA avec provisions</li>
              <li>Ratios prudentiels BCEAO</li>
            </ul>
            <button
              onClick={handleBCEAOExport}
              disabled={bceaoLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bceaoLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {bceaoLoading ? 'Génération…' : 'Générer Rapport BCEAO'}
            </button>
          </div>
        </SectionCard>

        {/* ── Carte 3 : Rapport Comité ───────────────────────────────────── */}
        <SectionCard
          title="Rapport Comité de Crédit"
          description="Rapport de synthèse pour le comité de crédit : KPIs, performance par zone, top risques, classification."
          icon={FileText}
          iconColor="bg-violet-100 text-violet-700"
        >
          <div className="space-y-3">
            <ul className="text-xs text-slate-500 space-y-1 pl-3 list-disc">
              <li>KPIs principaux (VNC, encours, LTV, Expected Loss)</li>
              <li>Performance par zone géographique</li>
              <li>Top 5 risques portefeuille</li>
              <li>Classification sain / surveillance / douteux / contentieux</li>
            </ul>
            <button
              onClick={handleComiteExport}
              disabled={comiteLoading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-700 text-white rounded-lg text-sm font-medium hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {comiteLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {comiteLoading ? 'Génération…' : 'Générer Rapport Comité'}
            </button>
          </div>
        </SectionCard>

        {/* ── Carte 4 : Exports planifiés ───────────────────────────────── */}
        <SectionCard
          title="Exports Planifiés"
          description="Automatisez la génération et l'envoi de rapports à une fréquence définie."
          icon={Calendar}
          iconColor="bg-amber-100 text-amber-700"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {exportsPlanifies.length} export{exportsPlanifies.length !== 1 ? 's' : ''} planifié{exportsPlanifies.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={loadExportsPlanifies}
                  disabled={exportsLoading}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 ${exportsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Planifier
                </button>
              </div>
            </div>

            {exportsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : exportsPlanifies.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">
                Aucun export planifié. Cliquez sur «&nbsp;Planifier&nbsp;» pour en créer un.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exportsPlanifies.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {TYPE_LABELS[ep.type] ?? ep.type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {FREQ_LABELS[ep.frequence] ?? ep.frequence}
                        {ep.prochainExport && (
                          <> — prochain le {new Date(ep.prochainExport).toLocaleDateString('fr-FR')}</>
                        )}
                      </p>
                      {ep.destinataires.length > 0 && (
                        <p className="text-xs text-slate-400 truncate">
                          {ep.destinataires.join(', ')}
                        </p>
                      )}
                    </div>
                    {ep.statut === 'ACTIF' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Modal Planification ────────────────────────────────────────────────── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Planifier un export
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Le rapport sera généré et envoyé automatiquement
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePlanifier} className="p-5 space-y-4">
              <div>
                <label className="form-label">Type de rapport *</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as 'BCEAO' | 'COMITE' | 'FICHE')}
                  className="form-input"
                  disabled={planSaving}
                >
                  <option value="BCEAO">Rapport BCEAO</option>
                  <option value="COMITE">Rapport Comité de Crédit</option>
                  <option value="FICHE">Fiches Hypothèques</option>
                </select>
              </div>

              <div>
                <label className="form-label">Fréquence *</label>
                <select
                  value={planFrequence}
                  onChange={(e) =>
                    setPlanFrequence(e.target.value as 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL')
                  }
                  className="form-input"
                  disabled={planSaving}
                >
                  <option value="QUOTIDIEN">Quotidien</option>
                  <option value="HEBDOMADAIRE">Hebdomadaire</option>
                  <option value="MENSUEL">Mensuel</option>
                </select>
              </div>

              <div>
                <label className="form-label">Destinataires (emails séparés par virgule) *</label>
                <input
                  type="text"
                  value={planDestinataires}
                  onChange={(e) => setPlanDestinataires(e.target.value)}
                  className="form-input"
                  placeholder="ex: risques@sgh.sn, audit@sgh.sn"
                  disabled={planSaving}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Séparez les adresses par des virgules
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  La planification nécessite que le service de notification soit configuré côté serveur.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                  disabled={planSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={planSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {planSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
