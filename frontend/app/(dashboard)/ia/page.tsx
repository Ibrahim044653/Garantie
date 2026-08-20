'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { iaApi } from '@/lib/api';

// ---------- Types ----------
type TabId = 'scoring' | 'anomalies' | 'reclassification';

type Rating = 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
type Classification = 'SAIN' | 'SOUS_SURVEILLANCE' | 'DOUTEUX' | 'CONTENTIEUX';
type Severite = 'HAUTE' | 'MOYENNE';

interface ScoringItem {
  nomClient: string;
  numeroPret: string;
  zone: string;
  ltv: number;
  score: number;
  rating: Rating;
  probabiliteDefaut: number;
}

interface ScoringResult {
  scoreMoyen: number;
  pctExcellent: number;
  pctRisque: number;
  distribution: Array<{ rating: string; count: number }>;
  items: ScoringItem[];
}

interface AnomalieItem {
  nomClient: string;
  typeAnomalie: string;
  valeur: number | string;
  zScore?: number;
  severite: Severite;
  actionSuggeree: string;
}

interface AnomalieResult {
  nbHaute: number;
  nbMoyenne: number;
  nbExpertisesPerimees: number;
  items: AnomalieItem[];
}

interface ReclassificationItem {
  nomClient: string;
  numeroPret: string;
  classificationActuelle: Classification;
  recommandation: Classification;
  raison: string;
}

interface ReclassificationResult {
  items: ReclassificationItem[];
}

// ---------- Constants ----------
const RATING_COLORS: Record<Rating, string> = {
  AA: '#22c55e',
  A: '#84cc16',
  BBB: '#f59e0b',
  BB: '#f97316',
  B: '#ef4444',
  CCC: '#7f1d1d',
};

const RATING_BADGE: Record<Rating, string> = {
  AA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  A: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  BBB: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  BB: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  B: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CCC: 'bg-red-900/60 text-red-200 dark:bg-red-900/50 dark:text-red-300',
};

const CLASS_BADGE: Record<Classification, string> = {
  SAIN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SOUS_SURVEILLANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  DOUTEUX: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CONTENTIEUX: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CLASS_LABEL: Record<Classification, string> = {
  SAIN: 'Sain',
  SOUS_SURVEILLANCE: 'Sous surveillance',
  DOUTEUX: 'Douteux',
  CONTENTIEUX: 'Contentieux',
};

const DISCLAIMER = (
  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400">
    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
    <span>
      Ces analyses sont basées sur des règles métier BCEAO/SYSCOHADA et des modèles statistiques.
      Elles constituent une aide à la décision et ne remplacent pas le jugement d&apos;un analyste.
    </span>
  </div>
);

// ---------- Component ----------
export default function IAPage() {
  const [activeTab, setActiveTab] = useState<TabId>('scoring');

  // Scoring state
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Anomalies state
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);
  const [anomaliesResult, setAnomaliesResult] = useState<AnomalieResult | null>(null);
  const [anomaliesError, setAnomaliesError] = useState<string | null>(null);

  // Reclassification state
  const [reclassLoading, setReclassLoading] = useState(false);
  const [reclassResult, setReclassResult] = useState<ReclassificationResult | null>(null);
  const [reclassError, setReclassError] = useState<string | null>(null);

  async function runScoring() {
    setScoringLoading(true);
    setScoringError(null);
    try {
      const res = await iaApi.scoring();
      setScoringResult(res.data ?? res.data?.data ?? null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setScoringError(err?.response?.data?.message ?? err?.message ?? 'Erreur inconnue');
    } finally {
      setScoringLoading(false);
    }
  }

  async function runAnomalies() {
    setAnomaliesLoading(true);
    setAnomaliesError(null);
    try {
      const res = await iaApi.anomalies();
      setAnomaliesResult(res.data ?? res.data?.data ?? null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setAnomaliesError(err?.response?.data?.message ?? err?.message ?? 'Erreur inconnue');
    } finally {
      setAnomaliesLoading(false);
    }
  }

  async function runReclass() {
    setReclassLoading(true);
    setReclassError(null);
    try {
      const res = await iaApi.reclassification();
      setReclassResult(res.data ?? res.data?.data ?? null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setReclassError(err?.response?.data?.message ?? err?.message ?? 'Erreur inconnue');
    } finally {
      setReclassLoading(false);
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'scoring', label: 'Scoring automatique', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'reclassification', label: 'Reclassification SYSCOHADA', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Brain className="w-7 h-7 text-purple-600" />
          Intelligence Artificielle
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Scoring automatique, détection d&apos;anomalies et reclassification assistée par les règles BCEAO/SYSCOHADA.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================================================================
          Tab 1 — Scoring automatique
      ================================================================ */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <button
            onClick={runScoring}
            disabled={scoringLoading}
            className="btn-primary flex items-center gap-2"
          >
            {scoringLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calcul en cours…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Calculer les scores
              </>
            )}
          </button>

          {scoringError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {scoringError}
            </div>
          )}

          {!scoringResult && !scoringLoading && !scoringError && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 space-y-2">
              <Brain className="w-10 h-10" />
              <p className="text-sm">Lancez le calcul pour voir les scores du portefeuille.</p>
            </div>
          )}

          {scoringResult && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-purple-500">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score moyen portefeuille</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {(scoringResult.scoreMoyen ?? 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">/ 100</p>
                </div>
                <div className="card p-4 border-l-4 border-green-500">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> % AA + A (excellent)
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {(scoringResult.pctExcellent ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="card p-4 border-l-4 border-red-500">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> % B + CCC (risqué)
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {(scoringResult.pctRisque ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* PieChart + BarChart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(scoringResult.distribution ?? []).length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Distribution des ratings
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={scoringResult.distribution}
                          dataKey="count"
                          nameKey="rating"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={(props) => {
                            const entry = (scoringResult.distribution ?? []).find(
                              (_, i) => i === props.index
                            );
                            return `${entry?.rating ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`;
                          }}
                        >
                          {scoringResult.distribution.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={RATING_COLORS[entry.rating as Rating] ?? '#94a3b8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Dossiers']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(scoringResult.distribution ?? []).length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Répartition par rating
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={scoringResult.distribution} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="rating" tick={{ fontSize: 12 }} width={35} />
                        <Tooltip />
                        <Bar dataKey="count" name="Dossiers" radius={[0, 4, 4, 0]}>
                          {scoringResult.distribution.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={RATING_COLORS[entry.rating as Rating] ?? '#94a3b8'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Table */}
              {(scoringResult.items ?? []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Client</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">N° Prêt</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Zone</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">LTV%</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Score</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Rating</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">PD%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoringResult.items.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-white">{row.nomClient}</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{row.numeroPret}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {row.zone}
                            </span>
                          </td>
                          <td className={`py-2 px-3 text-right font-medium ${(row.ltv ?? 0) > 100 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {(row.ltv ?? 0).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                            {(row.score ?? 0).toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RATING_BADGE[row.rating] ?? ''}`}>
                              {row.rating}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                            {(row.probabiliteDefaut ?? 0).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {DISCLAIMER}
        </div>
      )}

      {/* ================================================================
          Tab 2 — Détection d'anomalies
      ================================================================ */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <button
            onClick={runAnomalies}
            disabled={anomaliesLoading}
            className="btn-primary flex items-center gap-2"
          >
            {anomaliesLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Analyser le portefeuille
              </>
            )}
          </button>

          {anomaliesError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {anomaliesError}
            </div>
          )}

          {!anomaliesResult && !anomaliesLoading && !anomaliesError && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 space-y-2">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-sm">Lancez l&apos;analyse pour détecter les anomalies.</p>
            </div>
          )}

          {anomaliesResult && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-red-500">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Anomalies haute sévérité</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{anomaliesResult.nbHaute ?? 0}</p>
                </div>
                <div className="card p-4 border-l-4 border-orange-400">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Anomalies moyenne sévérité</p>
                  <p className="text-3xl font-bold text-orange-500 mt-1">{anomaliesResult.nbMoyenne ?? 0}</p>
                </div>
                <div className="card p-4 border-l-4 border-yellow-400">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expertises périmées</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{anomaliesResult.nbExpertisesPerimees ?? 0}</p>
                </div>
              </div>

              {/* Table */}
              {(anomaliesResult.items ?? []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Client</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Type anomalie</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Valeur</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Z-score</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Sévérité</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Action suggérée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomaliesResult.items.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-white">{row.nomClient}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {row.typeAnomalie}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                            {row.valeur}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                            {row.zScore != null ? row.zScore.toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.severite === 'HAUTE' ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Haute
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                Moyenne
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs">
                            {row.actionSuggeree}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(anomaliesResult.items ?? []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-green-600 space-y-2">
                  <CheckCircle className="w-10 h-10" />
                  <p className="text-sm font-medium">Aucune anomalie détectée dans le portefeuille.</p>
                </div>
              )}
            </div>
          )}

          {DISCLAIMER}
        </div>
      )}

      {/* ================================================================
          Tab 3 — Reclassification SYSCOHADA
      ================================================================ */}
      {activeTab === 'reclassification' && (
        <div className="space-y-6">
          {/* Explanation banner */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm text-purple-800 dark:text-purple-300">
            <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Analyse basée sur les règles Circulaire BCEAO 04-2017 et les critères SYSCOHADA.
              Le moteur compare la classification actuelle aux seuils réglementaires et propose une reclassification si nécessaire.
            </span>
          </div>

          <button
            onClick={runReclass}
            disabled={reclassLoading}
            className="btn-primary flex items-center gap-2"
          >
            {reclassLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Analyser les classifications
              </>
            )}
          </button>

          {reclassError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {reclassError}
            </div>
          )}

          {!reclassResult && !reclassLoading && !reclassError && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600 space-y-2">
              <HelpCircle className="w-10 h-10" />
              <p className="text-sm">Lancez l&apos;analyse pour voir les recommandations de reclassification.</p>
            </div>
          )}

          {reclassResult && (
            <div className="space-y-4">
              {(reclassResult.items ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-green-600 space-y-2">
                  <CheckCircle className="w-10 h-10" />
                  <p className="text-sm font-medium">
                    Toutes les classifications sont conformes aux règles BCEAO/SYSCOHADA.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {reclassResult.items.length} dossier(s) nécessitent une revue de classification.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Client</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">N° Prêt</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Classification actuelle</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Recommandation</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Raison</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reclassResult.items.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-2 px-3 font-medium text-slate-800 dark:text-white">{row.nomClient}</td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{row.numeroPret}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CLASS_BADGE[row.classificationActuelle] ?? ''}`}>
                                {CLASS_LABEL[row.classificationActuelle] ?? row.classificationActuelle}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CLASS_BADGE[row.recommandation] ?? ''}`}>
                                  {CLASS_LABEL[row.recommandation] ?? row.recommandation}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                              {row.raison}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Voir le dossier"
                              >
                                <Eye className="w-3 h-3" />
                                Voir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {DISCLAIMER}
        </div>
      )}
    </div>
  );
}
