'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Shield,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { apiClient, downloadBlob } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'SEARCH';

interface AuditLog {
  id: number;
  userId: number;
  user: {
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  action: AuditAction;
  entite: string;
  entiteId?: string | number;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<AuditAction, { label: string; color: string }> = {
  CREATE: { label: 'Création', color: 'bg-green-100 text-green-700' },
  UPDATE: { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  DELETE: { label: 'Suppression', color: 'bg-red-100 text-red-700' },
  LOGIN: { label: 'Connexion', color: 'bg-slate-100 text-slate-600' },
  EXPORT: { label: 'Export', color: 'bg-purple-100 text-purple-700' },
  SEARCH: { label: 'Recherche', color: 'bg-amber-100 text-amber-700' },
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrateur', color: 'bg-red-100 text-red-700' },
  GESTIONNAIRE_GARANTIES: { label: 'Gest. Garanties', color: 'bg-blue-100 text-blue-700' },
  RESPONSABLE_RISQUES: { label: 'Resp. Risques', color: 'bg-purple-100 text-purple-700' },
  ENGAGEMENTS: { label: 'Engagements', color: 'bg-orange-100 text-orange-700' },
  AUDIT_INTERNE: { label: 'Audit Interne', color: 'bg-teal-100 text-teal-700' },
};

const ENTITES = [
  'hypotheque',
  'pret',
  'client',
  'mainlevee',
  'recouvrement',
  'user',
  'document',
  'assurance',
  'workflow',
];

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditAction }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Details Modal ──────────────────────────────────────────────────────────────

function DetailsModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Détails de l&apos;entrée #{log.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {log.user.prenom} {log.user.nom} — {formatDate(log.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap text-slate-700 font-mono">
            {log.details
              ? JSON.stringify(log.details, null, 2)
              : '(aucun détail disponible)'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const { user, hasRole } = useAuth();

  const [data, setData] = useState<{ data: AuditLog[]; total: number; page: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters
  const [entite, setEntite] = useState('');
  const [action, setAction] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  const isAuthorized = hasRole('ADMIN', 'AUDIT_INTERNE');

  const fetchData = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (entite) params.entite = entite;
      if (action) params.action = action;
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;
      if (userIdFilter) params.userId = userIdFilter;

      const res = await apiClient.get('/audit', { params });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, page, entite, action, dateDebut, dateFin, userIdFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await apiClient.get('/audit/export', { responseType: 'blob' });
      downloadBlob(res.data, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      alert('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  // Access guard
  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield className="w-14 h-14 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Accès restreint</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          Accès réservé aux administrateurs et auditeurs internes.
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Journal d&apos;audit</h1>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exportLoading ? 'Export…' : 'Exporter CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-slate-600 mb-1">Utilisateur (ID)</label>
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              placeholder="ID utilisateur…"
              className="form-input w-full text-sm"
            />
          </div>
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="form-input w-full text-sm">
              <option value="">Toutes</option>
              {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Entité</label>
            <select value={entite} onChange={(e) => setEntite(e.target.value)} className="form-input w-full text-sm">
              <option value="">Toutes</option>
              {ENTITES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Date début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="form-input w-full text-sm" />
          </div>
          <div className="min-w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Date fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="form-input w-full text-sm" />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            Rechercher
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucune entrée d&apos;audit trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date / Heure</th>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Action</th>
                    <th>Entité</th>
                    <th>ID Entité</th>
                    <th>IP</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('fr-FR')}{' '}
                        <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{log.user.prenom} {log.user.nom}</p>
                          <p className="text-xs text-slate-400">{log.user.email}</p>
                        </div>
                      </td>
                      <td><RoleBadge role={log.user.role} /></td>
                      <td><ActionBadge action={log.action} /></td>
                      <td className="text-sm text-slate-600 capitalize">{log.entite}</td>
                      <td className="text-sm text-slate-500">{log.entiteId ?? '—'}</td>
                      <td className="text-xs text-slate-400 font-mono">{log.ip ?? '—'}</td>
                      <td>
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir
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
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                {data.total} entrée{data.total !== 1 ? 's' : ''} — Page {data.page} sur {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedLog && <DetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
