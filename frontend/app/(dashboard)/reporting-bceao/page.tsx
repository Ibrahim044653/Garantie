'use client';

import { useEffect, useState } from 'react';
import { Download, AlertTriangle, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { reportingBceaoApi, downloadBlob } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatutRatio = 'FAVORABLE' | 'ATTENTION' | 'DEFAVORABLE';

interface RatioPrudentiel {
  libelle: string;
  valeur: number;
  seuil: number;
  unite: string;
  statut: StatutRatio;
}

interface GrandRisque {
  id: number | string;
  nomClient: string;
  encours: number;
  pourcentagePortefeuille: number;
  depassementSeuil: boolean;
}

interface SyscohadaRow {
  rubriqueComptable: string;
  nombre: number;
  encours: number;
  provisions: number;
  tauxProvision: number;
}

interface Portefeuille {
  nombreHypotheques: number;
  encoursTotalFCFA: number;
  encoursTotalGlobal?: number;
  vncTotaleFCFA: number;
  vncTotaleGlobal?: number;
  tauxCouverture: number;
  provisions?: number;
}

interface ReportingBceaoData {
  portefeuille?: Portefeuille;
  ratiosPrudentiels?: RatioPrudentiel[];
  grandsRisques?: GrandRisque[];
  etatSyscohada?: SyscohadaRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtM(n: number): string {
  return (n / 1_000_000).toFixed(0) + ' M FCFA';
}

function fmtFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
}

function fmtPct(n: number, decimals = 1): string {
  return n.toFixed(decimals) + ' %';
}

const STATUT_COLORS: Record<StatutRatio, { value: string; badge: string; bar: string; icon: string }> = {
  FAVORABLE:   { value: 'text-green-600',  badge: 'bg-green-50 border-green-200',  bar: 'bg-green-500',  icon: 'text-green-500' },
  ATTENTION:   { value: 'text-amber-600',  badge: 'bg-amber-50 border-amber-200',  bar: 'bg-amber-400',  icon: 'text-amber-500' },
  DEFAVORABLE: { value: 'text-red-600',    badge: 'bg-red-50 border-red-200',      bar: 'bg-red-500',    icon: 'text-red-500'   },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportingBceaoPage() {
  const [data, setData] = useState<ReportingBceaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportingBceaoApi.ratios();
      setData(res.data?.data ?? res.data ?? {});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
        || (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error
        || (err instanceof Error ? err.message : 'Impossible de charger le reporting BCEAO.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportingBceaoApi.export();
      downloadBlob(res.data, 'reporting_bceao.xlsx');
    } catch {
      alert("Erreur lors de l'export Excel.");
    } finally {
      setExporting(false);
    }
  };

  const portefeuille = data?.portefeuille;
  const ratios = data?.ratiosPrudentiels ?? [];
  const grandsRisques = data?.grandsRisques ?? [];
  const syscohada = data?.etatSyscohada ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reporting BCEAO / Commission Bancaire</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            États réglementaires automatisés — Circulaire BCEAO
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center gap-2">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-slate-600 text-sm">{error}</p>
          <button onClick={load} className="text-blue-600 text-sm underline mt-1">Réessayer</button>
        </div>
      ) : (
        <>
          {/* Portefeuille summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre d'hypothèques</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {portefeuille?.nombreHypotheques ?? '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Encours total</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {portefeuille ? fmtM(portefeuille.encoursTotalFCFA ?? portefeuille.encoursTotalGlobal ?? 0) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">VNC totale</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {portefeuille ? fmtM(portefeuille.vncTotaleFCFA ?? portefeuille.vncTotaleGlobal ?? 0) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Taux de couverture</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {portefeuille ? fmtPct(portefeuille.tauxCouverture, 1) : '—'}
              </p>
            </div>
          </div>

          {/* Ratios prudentiels */}
          {ratios.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Ratios Prudentiels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ratios.map((ratio, idx) => {
                  const c = STATUT_COLORS[ratio.statut] ?? STATUT_COLORS['ATTENTION'];
                  // Progress as % of seuil (capped at 150% for visual)
                  const progress = ratio.seuil > 0
                    ? Math.min(150, (ratio.valeur / ratio.seuil) * 100)
                    : 0;
                  return (
                    <div key={idx} className={`bg-white rounded-xl shadow-sm border p-4 ${c.badge}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm font-semibold text-slate-700 leading-tight">{ratio.libelle}</p>
                        <span className={`text-xl font-bold tabular-nums ${c.value}`}>
                          {ratio.valeur.toFixed(1)}{ratio.unite}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${c.bar}`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Seuil : {ratio.seuil != null ? ratio.seuil.toFixed(1) : 'N/A'}{ratio.unite}</span>
                        <span className={`font-semibold ${c.value}`}>
                          {ratio.statut === 'FAVORABLE' ? 'Conforme' : ratio.statut === 'ATTENTION' ? 'À surveiller' : 'Non conforme'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grands Risques */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Grands Risques</h2>
                <p className="text-xs text-slate-400 mt-0.5">Expositions supérieures à 15% du portefeuille</p>
              </div>
              {grandsRisques.filter((g) => g.depassementSeuil).length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {grandsRisques.filter((g) => g.depassementSeuil).length} dépassement(s)
                </span>
              )}
            </div>
            {grandsRisques.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <p className="text-slate-500 text-sm">Aucun grand risque identifié.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                      <th className="text-left px-4 py-3 font-semibold">Client</th>
                      <th className="text-right px-4 py-3 font-semibold">Encours (FCFA)</th>
                      <th className="text-right px-4 py-3 font-semibold">% Portefeuille</th>
                      <th className="text-right px-4 py-3 font-semibold">Dépassement seuil (15%)</th>
                      <th className="text-center px-4 py-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {grandsRisques.map((gr) => {
                      const dep = gr.pourcentagePortefeuille - 15;
                      return (
                        <tr key={gr.id} className={`hover:bg-slate-50 transition-colors ${gr.depassementSeuil ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-3 font-medium text-slate-800">{gr.nomClient}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtFCFA(gr.encours)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            <span className={gr.depassementSeuil ? 'text-red-600' : 'text-slate-700'}>
                              {fmtPct(gr.pourcentagePortefeuille, 1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {gr.depassementSeuil ? (
                              <span className="text-red-600 font-semibold">+{fmtPct(dep, 1)}</span>
                            ) : (
                              <span className="text-green-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {gr.depassementSeuil ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3" /> ALERTE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3" /> OK
                              </span>
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

          {/* État SYSCOHADA */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">État SYSCOHADA</h2>
              <p className="text-xs text-slate-400 mt-0.5">Classification comptable réglementaire</p>
            </div>
            {syscohada.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-slate-500 text-sm">Aucune donnée SYSCOHADA disponible.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                      <th className="text-left px-4 py-3 font-semibold">Rubrique comptable</th>
                      <th className="text-right px-4 py-3 font-semibold">Nombre</th>
                      <th className="text-right px-4 py-3 font-semibold">Encours (M FCFA)</th>
                      <th className="text-right px-4 py-3 font-semibold">Provisions (M FCFA)</th>
                      <th className="text-right px-4 py-3 font-semibold">Taux provision (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {syscohada.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.rubriqueComptable}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.nombre}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {(row.encours / 1_000_000).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-red-700 font-semibold">
                          {(row.provisions / 1_000_000).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`font-semibold ${
                            row.tauxProvision >= 100
                              ? 'text-red-600'
                              : row.tauxProvision >= 50
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}>
                            {fmtPct(row.tauxProvision, 1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
