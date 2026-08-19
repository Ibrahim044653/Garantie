'use client';

import { useEffect, useState } from 'react';
import { Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { provisionsApi, downloadBlob } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Classification = 'SAIN' | 'SOUS_SURVEILLANCE' | 'DOUTEUX' | 'CONTENTIEUX';

interface ProvisionRow {
  id: number | string;
  nomClient: string;
  numeroPret: string;
  classification: Classification;
  ead: number;
  vnc: number;
  lgd: number;
  pd: number;
  provisionBceao: number;
  ltv: number;
  statutPret: string;
}

interface ProvisionData {
  rows: ProvisionRow[];
  encoursTotalGlobal?: number;
  provisionsTotalesGlobal?: number;
  vncTotaleGlobal?: number;
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

const CLASS_ORDER: Classification[] = ['CONTENTIEUX', 'DOUTEUX', 'SOUS_SURVEILLANCE', 'SAIN'];

const CLASS_COLORS: Record<Classification, { bg: string; border: string; text: string; badge: string }> = {
  SAIN: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  SOUS_SURVEILLANCE: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  DOUTEUX: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
  },
  CONTENTIEUX: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
};

const CLASS_LABELS: Record<Classification, string> = {
  SAIN: 'Sain',
  SOUS_SURVEILLANCE: 'Sous Surveillance',
  DOUTEUX: 'Douteux',
  CONTENTIEUX: 'Contentieux',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProvisionsPage() {
  const [rows, setRows] = useState<ProvisionRow[]>([]);
  const [meta, setMeta] = useState<Pick<ProvisionData, 'encoursTotalGlobal' | 'provisionsTotalesGlobal' | 'vncTotaleGlobal'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await provisionsApi.get();
      const data: ProvisionData = res.data?.data ?? res.data ?? {};
      const rawRows: ProvisionRow[] = data.rows ?? (Array.isArray(res.data) ? res.data : []);
      // Sort by severity
      const sorted = [...rawRows].sort(
        (a, b) => CLASS_ORDER.indexOf(a.classification) - CLASS_ORDER.indexOf(b.classification)
      );
      setRows(sorted);
      setMeta({
        encoursTotalGlobal: data.encoursTotalGlobal,
        provisionsTotalesGlobal: data.provisionsTotalesGlobal,
        vncTotaleGlobal: data.vncTotaleGlobal,
      });
    } catch {
      setError('Impossible de charger les provisions.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const encours = meta.encoursTotalGlobal ?? rows.reduce((s, r) => s + r.ead, 0);
  const provisions = meta.provisionsTotalesGlobal ?? rows.reduce((s, r) => s + r.provisionBceao, 0);
  const vncTotale = meta.vncTotaleGlobal ?? rows.reduce((s, r) => s + r.vnc, 0);
  const tauxProv = encours > 0 ? (provisions / encours) * 100 : 0;

  const douteuxCount = rows.filter((r) => r.classification === 'DOUTEUX' || r.classification === 'CONTENTIEUX').length;
  const douteuxEncours = rows
    .filter((r) => r.classification === 'DOUTEUX' || r.classification === 'CONTENTIEUX')
    .reduce((s, r) => s + r.ead, 0);
  const tauxDouteux = encours > 0 ? (douteuxEncours / encours) * 100 : 0;

  // ── By classification ──────────────────────────────────────────────────────
  const byClass = (['SAIN', 'SOUS_SURVEILLANCE', 'DOUTEUX', 'CONTENTIEUX'] as Classification[]).map((cls) => {
    const subset = rows.filter((r) => r.classification === cls);
    return {
      cls,
      count: subset.length,
      encours: subset.reduce((s, r) => s + r.ead, 0),
      provision: subset.reduce((s, r) => s + r.provisionBceao, 0),
    };
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await provisionsApi.export();
      downloadBlob(res.data, 'provisions_ifrs9_bceao.xlsx');
    } catch {
      alert("Erreur lors de l'export Excel.");
    } finally {
      setExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Provisions IFRS 9 / BCEAO</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Classification et provisionnement réglementaire des créances hypothécaires
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

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Encours total</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{fmtM(encours)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Provisions totales</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmtM(provisions)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Taux : {fmtPct(tauxProv, 1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">VNC totale</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{fmtM(vncTotale)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Créances douteuses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{douteuxCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtPct(tauxDouteux, 1)} de l'encours</p>
        </div>
      </div>

      {/* Classification breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {byClass.map(({ cls, count, encours: enc, provision }) => {
          const c = CLASS_COLORS[cls];
          return (
            <div
              key={cls}
              className={`rounded-xl border p-4 ${c.bg} ${c.border}`}
            >
              <p className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>
                {CLASS_LABELS[cls]}
              </p>
              <p className={`text-3xl font-bold mt-1 ${c.text}`}>{count}</p>
              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                <p>Encours : <span className="font-semibold">{fmtM(enc)}</span></p>
                <p>Provision : <span className="font-semibold">{fmtM(provision)}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Détail par créance</h2>
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
            <p className="text-slate-500 text-sm">Aucune provision disponible.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-semibold">Client</th>
                  <th className="text-left px-4 py-3 font-semibold">N° Prêt</th>
                  <th className="text-left px-4 py-3 font-semibold">Classification</th>
                  <th className="text-right px-4 py-3 font-semibold">EAD (FCFA)</th>
                  <th className="text-right px-4 py-3 font-semibold">VNC (FCFA)</th>
                  <th className="text-right px-4 py-3 font-semibold">LGD (%)</th>
                  <th className="text-right px-4 py-3 font-semibold">PD (%)</th>
                  <th className="text-right px-4 py-3 font-semibold">Provision BCEAO</th>
                  <th className="text-right px-4 py-3 font-semibold">LTV (%)</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut Prêt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => {
                  const c = CLASS_COLORS[row.classification];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.nomClient}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{row.numeroPret}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                          {CLASS_LABELS[row.classification]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtFCFA(row.ead)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtFCFA(row.vnc)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtPct(row.lgd, 1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtPct(row.pd, 1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-700">{fmtFCFA(row.provisionBceao)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtPct(row.ltv, 1)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{row.statutPret}</span>
                      </td>
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
