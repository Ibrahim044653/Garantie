'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { scoringApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Niveau = 'AAA' | 'BBB' | 'BB' | 'B' | 'CCC';

interface ScoreRow {
  id: number | string;
  nomClient: string;
  numeroPret: string;
  score: number;
  niveau: Niveau;
  pd: number;
  lgd: number;
  ead: number;
  expectedLoss: number;
  ltv: number;
}

interface StressScenario {
  label: string;
  facteur: number;
  vncTotale: number;
  shortfalls: number;
  provisionsTotales: number;
  nplRatio: number;
}

interface ScoringData {
  rows: ScoreRow[];
  scoreMoyen?: number;
  pdMoyen?: number;
  lgdMoyen?: number;
  expectedLossTotal?: number;
  distribution?: Record<Niveau, number>;
  stressTests?: StressScenario[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtM(n: number): string {
  return (n / 1_000_000).toFixed(1) + ' M FCFA';
}

function fmtFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
}

function fmtPct(n: number, decimals = 1): string {
  return n.toFixed(decimals) + ' %';
}
// PD and LGD come as 0-1 fractions from the API — multiply by 100 for display
function fmtFraction(n: number, decimals = 1): string {
  return (n * 100).toFixed(decimals) + ' %';
}

const NIVEAUX: Niveau[] = ['AAA', 'BBB', 'BB', 'B', 'CCC'];

const NIVEAU_COLORS: Record<Niveau, { badge: string; bar: string; text: string }> = {
  AAA: { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', text: 'text-green-700' },
  BBB: { badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', text: 'text-blue-700' },
  BB:  { badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400', text: 'text-yellow-700' },
  B:   { badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500', text: 'text-orange-700' },
  CCC: { badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', text: 'text-red-700' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScoringPage() {
  const [data, setData] = useState<ScoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scoringApi.get();
      const raw: ScoringData = res.data?.data ?? res.data ?? {};
      // Sort rows by score ascending (worst first)
      if (raw.rows) {
        raw.rows = [...raw.rows].sort((a, b) => a.score - b.score);
      }
      setData(raw);
    } catch {
      setError('Impossible de charger les données de scoring.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = data?.rows ?? [];

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const scoreMoyen = data?.scoreMoyen ?? (rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0);
  const pdMoyen = data?.pdMoyen ?? (rows.length ? rows.reduce((s, r) => s + r.pd, 0) / rows.length : 0);
  const lgdMoyen = data?.lgdMoyen ?? (rows.length ? rows.reduce((s, r) => s + r.lgd, 0) / rows.length : 0);
  const expectedLossTotal = data?.expectedLossTotal ?? rows.reduce((s, r) => s + r.expectedLoss, 0);

  // ── Distribution ───────────────────────────────────────────────────────────
  const distribution: Record<Niveau, number> = data?.distribution ?? NIVEAUX.reduce((acc, n) => {
    acc[n] = rows.filter((r) => r.niveau === n).length;
    return acc;
  }, {} as Record<Niveau, number>);
  const maxCount = Math.max(...Object.values(distribution), 1);

  // ── Stress tests ───────────────────────────────────────────────────────────
  const stressTests: StressScenario[] = data?.stressTests ?? [
    { label: 'Baseline', facteur: 0, vncTotale: 0, shortfalls: 0, provisionsTotales: 0, nplRatio: 0 },
    { label: 'Adverse -15%', facteur: -15, vncTotale: 0, shortfalls: 0, provisionsTotales: 0, nplRatio: 0 },
    { label: 'Sévère -30%', facteur: -30, vncTotale: 0, shortfalls: 0, provisionsTotales: 0, nplRatio: 0 },
  ];

  const stressCardStyle = (index: number) => {
    if (index === 0) return { header: 'bg-blue-600 text-white', border: 'border-blue-200' };
    if (index === 1) return { header: 'bg-amber-500 text-white', border: 'border-amber-200' };
    return { header: 'bg-red-600 text-white', border: 'border-red-200' };
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Scoring & Analyse de Risque</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Modèle de scoring interne — Probabilité de défaut (PD) et Perte en cas de défaut (LGD)
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculer
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Score moyen</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{scoreMoyen.toFixed(1)} / 20</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PD moyen portefeuille</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmtFraction(pdMoyen, 1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">LGD moyen</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{fmtFraction(lgdMoyen, 1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Loss total</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{fmtM(expectedLossTotal)}</p>
        </div>
      </div>

      {/* Distribution + Stress tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Distribution par niveau</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {NIVEAUX.map((n) => {
                const count = distribution[n] ?? 0;
                const pct = rows.length > 0 ? (count / rows.length) * 100 : 0;
                const c = NIVEAU_COLORS[n];
                return (
                  <div key={n} className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-10 text-xs font-bold px-1.5 py-0.5 rounded ${c.badge}`}>
                      {n}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${c.bar} transition-all duration-500`}
                        style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-14 text-right tabular-nums">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stress tests */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Stress Tests immobiliers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stressTests.map((scenario, idx) => {
              const style = stressCardStyle(idx);
              return (
                <div key={idx} className={`rounded-xl border overflow-hidden ${style.border}`}>
                  <div className={`px-4 py-2.5 ${style.header}`}>
                    <p className="text-xs font-bold uppercase tracking-wide">{scenario.label}</p>
                  </div>
                  <div className="bg-white px-4 py-3 space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">VNC totale</p>
                      <p className="text-sm font-bold text-slate-800">{fmtM(scenario.vncTotale)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Shortfalls</p>
                      <p className="text-sm font-bold text-slate-800">{scenario.shortfalls}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Provisions totales</p>
                      <p className="text-sm font-bold text-slate-800">{fmtM(scenario.provisionsTotales)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">NPL ratio</p>
                      <p className="text-sm font-bold text-slate-800">{fmtPct(scenario.nplRatio, 1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Score detail table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Détail scoring par créance</h2>
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
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-slate-500 text-sm">Aucune donnée de scoring disponible.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-semibold">Client</th>
                  <th className="text-left px-4 py-3 font-semibold">N° Prêt</th>
                  <th className="text-right px-4 py-3 font-semibold">Score (/20)</th>
                  <th className="text-left px-4 py-3 font-semibold">Niveau</th>
                  <th className="text-right px-4 py-3 font-semibold">PD (%)</th>
                  <th className="text-right px-4 py-3 font-semibold">LGD (%)</th>
                  <th className="text-right px-4 py-3 font-semibold">EAD (M FCFA)</th>
                  <th className="text-right px-4 py-3 font-semibold">Expected Loss</th>
                  <th className="text-right px-4 py-3 font-semibold">LTV (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => {
                  const c = NIVEAU_COLORS[row.niveau] ?? NIVEAU_COLORS['B'];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.nomClient}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{row.numeroPret}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${c.text}`}>{row.score.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>
                          {row.niveau}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtFraction(row.pd, 1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtFraction(row.lgd, 1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{(row.ead / 1_000_000).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-700">{fmtFCFA(row.expectedLoss)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtPct(row.ltv, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
