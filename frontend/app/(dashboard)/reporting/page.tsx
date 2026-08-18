'use client';

import { useEffect, useState } from 'react';
import { Download, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { reportingApi, downloadBlob } from '@/lib/api';
import { formatFCFA, formatDate, formatPercent } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ReportingRow, StatutHypotheque } from '@/types';

export default function ReportingPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<ReportingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportingApi.annuel(annee);
      setRows(res.data?.data ?? res.data ?? []);
    } catch {
      setError('Impossible de charger le rapport.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [annee]);

  const handleExport = async () => {
    try {
      const res = await reportingApi.exportCsv(annee);
      downloadBlob(res.data, `rapport_hypotheques_${annee}.csv`);
    } catch {
      alert('Erreur lors de l\'export');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const shortfallCount = rows.filter((r) => r.alerteShortfall).length;
  const obsoleteCount = rows.filter((r) => r.statut === 'EXPERTISE_OBSOLETE').length;
  const couvertureMoy =
    rows.length ? rows.reduce((s, r) => s + r.ratioCouverture, 0) / rows.length : 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Rapport Annuel</p>
              <p className="text-xs text-slate-500">
                Conformité Circulaire 04-2017
              </p>
            </div>
            <select
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="form-input w-auto text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={load}
              className="p-2 rounded-lg hover:bg-slate-100"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{rows.length}</p>
          <p className="text-xs text-slate-500 mt-1">Hypothèques</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{shortfallCount}</p>
          <p className="text-xs text-slate-500 mt-1">Shortfall</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{obsoleteCount}</p>
          <p className="text-xs text-slate-500 mt-1">Expertises Obsolètes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{couvertureMoy.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-1">Couverture Moy.</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        ) : !rows.length ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-slate-500 text-sm">Aucune donnée pour {annee}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Titre Foncier</th>
                  <th>Client</th>
                  <th>Valeur Expertise</th>
                  <th>Date Expertise</th>
                  <th>Décote Totale</th>
                  <th>VNC</th>
                  <th>Statut</th>
                  <th>Ratio Couverture</th>
                  <th>Shortfall</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.alerteShortfall
                        ? 'row-danger'
                        : row.statut === 'EXPERTISE_OBSOLETE'
                        ? 'row-warning'
                        : ''
                    }
                  >
                    <td className="font-medium text-blue-600">
                      {row.numeroTitreFoncier}
                    </td>
                    <td>{row.nomClient}</td>
                    <td className="tabular-nums">
                      {formatFCFA(row.valeurExpertise)}
                    </td>
                    <td>{formatDate(row.dateExpertise)}</td>
                    <td className="tabular-nums font-medium">
                      {formatPercent(row.decoteTotale)}
                    </td>
                    <td className="tabular-nums font-bold text-blue-700">
                      {formatFCFA(row.vnc)}
                    </td>
                    <td>
                      <StatusBadge statut={row.statut as StatutHypotheque} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full max-w-16">
                          <div
                            className={`h-1.5 rounded-full ${
                              row.ratioCouverture >= 100
                                ? 'bg-green-500'
                                : row.ratioCouverture >= 80
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(100, row.ratioCouverture)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`tabular-nums text-sm font-semibold ${
                            row.ratioCouverture >= 100
                              ? 'text-green-600'
                              : row.ratioCouverture >= 80
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {row.ratioCouverture.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {row.alerteShortfall ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Oui
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">
                          Non
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
