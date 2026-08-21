'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Zap,
  RotateCcw,
  Play,
  Info,
} from 'lucide-react';
import { simulationApi } from '@/lib/api';

// ---------- Types ----------
interface StressResult {
  nouveauxShortfalls: number;
  shortfallsAggraves: number;
  deltaProvisions: number;
  impactPorcentage: number;
  parZone: Array<{
    zone: string;
    actuel: number;
    simule: number;
  }>;
  top10: Array<{
    nomClient: string;
    numeroPret: string;
    zone: string;
    soldePret: number;
    vncActuel: number;
    vncSimule: number;
    delta: number;
  }>;
}

interface ProvisionResult {
  series: Array<{
    horizon: number;
    provision: number;
  }>;
  details: Array<{
    horizon: number;
    sain: number;
    surveillance: number;
    douteux: number;
    contentieux: number;
    provisionEstimee: number;
    deltaActuel: number;
  }>;
}

// ---------- Helpers ----------
function fmtFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
}

function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

const SCENARIOS = [
  { label: 'Optimiste', value: -5 },
  { label: 'Modéré', value: -15 },
  { label: 'Pessimiste', value: -25 },
  { label: 'Stress BCEAO', value: -35 },
  { label: 'Crise extrême', value: -50 },
];

// ---------- Component ----------
export default function SimulationPage() {
  const [scenarioPct, setScenarioPct] = useState(-15);
  const [stressLoading, setStressLoading] = useState(false);
  const [stressResult, setStressResult] = useState<StressResult | null>(null);
  const [stressError, setStressError] = useState<string | null>(null);

  const [provLoading, setProvLoading] = useState(false);
  const [provResult, setProvResult] = useState<ProvisionResult | null>(null);
  const [provError, setProvError] = useState<string | null>(null);

  async function runStressTest() {
    setStressLoading(true);
    setStressError(null);
    try {
      // Backend attend une valeur positive (0-80), le slider utilise des valeurs négatives
      const res = await simulationApi.stressTest(Math.abs(scenarioPct));
      const d = res.data;
      if (!d) { setStressResult(null); return; }

      // Transformer parZone (objet) en tableau attendu par les graphiques
      const parZoneArr = Object.entries(d.parZone ?? {}).map(([zone, vals]: [string, unknown]) => {
        const v = vals as { actuel: number; simule: number };
        return { zone, actuel: v.actuel, simule: v.simule };
      });

      // Calculer l'impact % sur le shortfall total
      const totalActuel = d.totalShortfallActuel ?? 0;
      const totalSimule = d.totalShortfallSimule ?? 0;
      const impactPct = totalActuel > 0 ? ((totalSimule - totalActuel) / totalActuel) * 100 : scenarioPct;

      setStressResult({
        nouveauxShortfalls: d.nbNouveauxShortfalls ?? 0,
        shortfallsAggraves: d.nbShortfallsAggraves ?? 0,
        deltaProvisions:    d.impactProvisionsEstime ?? d.deltaTotal ?? 0,
        impactPorcentage:   impactPct,
        parZone: parZoneArr,
        top10: (d.top10Impactes ?? []).map((item: {
          nomClient: string; zoneGeographique: string;
          shortfallActuel: number; shortfallSimule: number; delta: number;
        }) => ({
          nomClient:  item.nomClient,
          numeroPret: '—',
          zone:       item.zoneGeographique,
          soldePret:  item.shortfallSimule,
          vncActuel:  item.shortfallActuel,
          vncSimule:  item.shortfallSimule,
          delta:      item.delta,
        })),
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setStressError(err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Erreur inconnue');
    } finally {
      setStressLoading(false);
    }
  }

  async function runProvisions() {
    setProvLoading(true);
    setProvError(null);
    try {
      // Horizons en trimestres : 0=actuel, 1=T+3mois, 2=T+6mois, 4=T+12mois
      const res = await simulationApi.provisions([0, 1, 2, 4]);
      const d = res.data;
      if (!d) { setProvResult(null); return; }

      // Mapper la réponse backend vers le format attendu par les graphiques
      const horizons: typeof d.horizons = d.horizons ?? [];
      setProvResult({
        series: horizons.map((h: { mois: number; provisionEstimee: number }) => ({
          horizon: h.mois,
          provision: h.provisionEstimee,
        })),
        details: horizons.map((h: {
          mois: number;
          distribution: { SAIN: number; SURVEILLANCE: number; DOUTEUX: number; CONTENTIEUX: number };
          provisionEstimee: number;
          deltaVsActuel: number;
        }) => ({
          horizon:        h.mois,
          sain:           h.distribution.SAIN,
          surveillance:   h.distribution.SURVEILLANCE,
          douteux:        h.distribution.DOUTEUX,
          contentieux:    h.distribution.CONTENTIEUX,
          provisionEstimee: h.provisionEstimee,
          deltaActuel:    h.deltaVsActuel,
        })),
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setProvError(err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Erreur inconnue');
    } finally {
      setProvLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <TrendingDown className="w-7 h-7 text-blue-600" />
          Simulation &amp; Prévision
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Modélisez l&apos;impact de chocs immobiliers sur le portefeuille et projetez les provisions futures.
        </p>
      </div>

      {/* ================================================================
          Section 1 — Stress Test Immobilier
      ================================================================ */}
      <section className="card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Stress Test Immobilier
          </h2>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <label className="form-label">
            Scénario de décote immobilière :{' '}
            <span className="font-bold text-orange-600">{scenarioPct}%</span>
          </label>
          <input
            type="range"
            min={-50}
            max={-5}
            step={5}
            value={scenarioPct}
            onChange={(e) => setScenarioPct(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>-50% (Crise extrême)</span>
            <span>-5% (Optimiste)</span>
          </div>
        </div>

        {/* Scenario buttons */}
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.value}
              onClick={() => setScenarioPct(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                scenarioPct === s.value
                  ? 'bg-orange-600 border-orange-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {s.label} ({s.value}%)
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={runStressTest}
            disabled={stressLoading}
            className="btn-primary flex items-center gap-2"
          >
            {stressLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Simulation en cours…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Lancer la simulation
              </>
            )}
          </button>
          {stressResult && (
            <button
              onClick={() => setStressResult(null)}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Error */}
        {stressError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {stressError}
          </div>
        )}

        {/* Empty state */}
        {!stressResult && !stressLoading && !stressError && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 space-y-2">
            <TrendingDown className="w-10 h-10" />
            <p className="text-sm">Sélectionnez un scénario et lancez la simulation.</p>
          </div>
        )}

        {/* Results */}
        {stressResult && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 border-l-4 border-orange-500">
                <p className="text-xs text-slate-500 dark:text-slate-400">Nouveaux shortfalls</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stressResult.nouveauxShortfalls ?? 0}
                </p>
              </div>
              <div className="card p-4 border-l-4 border-red-500">
                <p className="text-xs text-slate-500 dark:text-slate-400">Shortfalls aggravés</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stressResult.shortfallsAggraves ?? 0}
                </p>
              </div>
              <div className="card p-4 border-l-4 border-yellow-500">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Delta provisions
                </p>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mt-1 break-words">
                  {fmtFCFA(stressResult.deltaProvisions ?? 0)}
                </p>
              </div>
              <div className="card p-4 border-l-4 border-blue-500">
                <p className="text-xs text-slate-500 dark:text-slate-400">Impact portefeuille</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {fmtPct(stressResult.impactPorcentage ?? 0)}
                </p>
              </div>
            </div>

            {/* Chart par zone */}
            {(stressResult.parZone ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Comparaison par zone (VNC actuel vs simulé)
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stressResult.parZone} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="zone" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => fmtFCFA(Number(v))} />
                    <Legend />
                    <Bar dataKey="actuel" name="VNC Actuel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="simule" name="VNC Simulé" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top 10 table */}
            {(stressResult.top10 ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Top 10 hypothèques les plus impactées
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Client</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">N° Prêt</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Zone</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Solde prêt</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">VNC actuel</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">VNC simulé</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stressResult.top10.map((row, i) => (
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
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmtFCFA(row.soldePret ?? 0)}</td>
                          <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmtFCFA(row.vncActuel ?? 0)}</td>
                          <td className="py-2 px-3 text-right text-orange-600 font-medium">{fmtFCFA(row.vncSimule ?? 0)}</td>
                          <td className="py-2 px-3 text-right font-bold text-red-600">
                            {fmtFCFA(row.delta ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================================================================
          Section 2 — Prévision Provisions
      ================================================================ */}
      <section className="card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Prévision des Provisions
          </h2>
        </div>

        <button
          onClick={runProvisions}
          disabled={provLoading}
          className="btn-primary flex items-center gap-2"
        >
          {provLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calcul en cours…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Calculer les prévisions 3 / 6 / 12 mois
            </>
          )}
        </button>

        {/* Error */}
        {provError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {provError}
          </div>
        )}

        {/* Empty state */}
        {!provResult && !provLoading && !provError && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 space-y-2">
            <DollarSign className="w-10 h-10" />
            <p className="text-sm">Lancez l&apos;analyse pour voir les prévisions de provisions.</p>
          </div>
        )}

        {/* Results */}
        {provResult && (
          <div className="space-y-6">
            {/* Line chart */}
            {(provResult.series ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Évolution des provisions (FCFA)
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={provResult.series} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="horizon"
                      tickFormatter={(v) => v === 0 ? 'Actuel' : `+${v} mois`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(v) => fmtFCFA(Number(v))}
                      labelFormatter={(l) => l === 0 ? 'Actuel' : `Horizon +${l} mois`}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="provision"
                      name="Provisions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Details table */}
            {(provResult.details ?? []).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Horizon</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">SAIN</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">SURV.</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">DOUTEUX</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-500 dark:text-slate-400">CONTENTIEUX</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Provision estimée</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Delta vs actuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provResult.details.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {row.horizon === 0 ? 'Actuel' : `+${row.horizon} mois`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {row.sain ?? 0}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            {row.surveillance ?? 0}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            {row.douteux ?? 0}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            {row.contentieux ?? 0}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                          {fmtFCFA(row.provisionEstimee ?? 0)}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${(row.deltaActuel ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {fmtPct(row.deltaActuel ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-400">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Les prévisions sont basées sur les tendances du portefeuille actuel et les règles BCEAO Circulaire 04-2017.
            Elles constituent une aide à la décision et doivent être validées par un analyste.
          </span>
        </div>
      </section>
    </div>
  );
}
