'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { gedApi, downloadBlob } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type GedType =
  | 'ACTE_PROPRIETE'
  | 'RAPPORT_EXPERTISE'
  | 'TITRE_FONCIER'
  | 'MAINLEVEE'
  | 'CONTRAT_PRET'
  | 'POLICE_ASSURANCE'
  | 'AUTRE';

type GedStatut = 'ACTIF' | 'ARCHIVE';

interface GedVersion {
  id?: number;
  numeroVersion: number;
  taille: number;
  fileName: string;
  createdAt?: string;
}

interface GedDocument {
  id: number;
  titre: string;
  type: GedType;
  statut: GedStatut;
  description?: string;
  nomClient?: string;
  numeroPret?: string;
  versionActuelle: number;
  latestVersion?: GedVersion;
  totalVersions?: number;
  createdAt: string;
  updatedAt: string;
}

interface GedStats {
  totalDocuments: number;
  documentsActifs?: number;
  versionsTotales?: number;
  totalVersions?: number;
  tailleTotale?: number;
  totalSizeMB?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<GedType, string> = {
  ACTE_PROPRIETE:     'Acte de propriété',
  RAPPORT_EXPERTISE:  'Rapport d\'expertise',
  TITRE_FONCIER:      'Titre foncier',
  MAINLEVEE:          'Mainlevée',
  CONTRAT_PRET:       'Contrat de prêt',
  POLICE_ASSURANCE:   'Police d\'assurance',
  AUTRE:              'Autre',
};

const TYPE_BADGE: Record<GedType, string> = {
  RAPPORT_EXPERTISE:  'bg-blue-100 text-blue-700',
  TITRE_FONCIER:      'bg-green-100 text-green-700',
  ACTE_PROPRIETE:     'bg-purple-100 text-purple-700',
  MAINLEVEE:          'bg-teal-100 text-teal-700',
  CONTRAT_PRET:       'bg-indigo-100 text-indigo-700',
  POLICE_ASSURANCE:   'bg-orange-100 text-orange-700',
  AUTRE:              'bg-slate-100 text-slate-600',
};

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<GedType>('AUTRE');
  const [description, setDescription] = useState('');
  const [entiteType, setEntiteType] = useState<'hypotheque' | 'pret' | 'client'>('hypotheque');
  const [entiteId, setEntiteId] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Veuillez sélectionner un fichier.'); return; }
    if (!titre.trim()) { setError('Le titre est requis.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('titre', titre);
      fd.append('type', type);
      fd.append('description', description);
      fd.append('entiteType', entiteType);
      fd.append('entiteId', entiteId);
      fd.append('commentaire', commentaire);
      fd.append('file', file);
      await gedApi.upload(fd);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur lors de l\'upload. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Nouveau document</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex : Acte de propriété Lot 42"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type de document *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as GedType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(TYPE_LABELS) as GedType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Description facultative..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Entité liée</label>
              <select
                value={entiteType}
                onChange={e => setEntiteType(e.target.value as 'hypotheque' | 'pret' | 'client')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hypotheque">Hypothèque</option>
                <option value="pret">Prêt</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ID entité</label>
              <input
                type="number"
                value={entiteId}
                onChange={e => setEntiteId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Commentaire</label>
            <input
              type="text"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Commentaire sur la version..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fichier * (.pdf, .jpg, .jpeg, .png)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Upload en cours...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GedPage() {
  const [docs, setDocs] = useState<GedDocument[]>([]);
  const [stats, setStats] = useState<GedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterTitre, setFilterTitre] = useState('');

  // Download state
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string>('');
  const [archiving, setArchiving] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {};
      if (filterType) params.type = filterType;
      if (filterStatut) params.statut = filterStatut;
      if (filterTitre) params.titre = filterTitre;

      const [docsRes, statsRes] = await Promise.all([
        gedApi.list(params),
        gedApi.stats(),
      ]);
      setDocs(docsRes.data?.data ?? docsRes.data ?? []);
      setStats(statsRes.data?.data ?? statsRes.data ?? null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
        || (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error
        || (err instanceof Error ? err.message : 'Impossible de charger les documents.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatut, filterTitre]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDownload(doc: GedDocument) {
    setDownloading(doc.id);
    setDownloadError('');
    try {
      const res = await gedApi.download(doc.id);
      const fileName = doc.latestVersion?.fileName ?? `${doc.titre.replace(/\s+/g, '_')}.pdf`;
      downloadBlob(res.data, fileName);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setDownloadError(`Le fichier "${doc.titre}" n'est plus disponible sur le serveur. Veuillez le re-uploader.`);
      } else {
        setDownloadError('Erreur lors du téléchargement. Réessayez dans quelques instants.');
      }
    } finally {
      setDownloading(null);
    }
  }

  async function handleArchive(doc: GedDocument) {
    if (!confirm(`Archiver "${doc.titre}" ?`)) return;
    setArchiving(doc.id);
    try {
      await gedApi.archive(doc.id);
      await fetchData();
    } catch {
      alert('Erreur lors de l\'archivage.');
    } finally {
      setArchiving(null);
    }
  }

  const lastVersion = (doc: GedDocument): GedVersion | undefined =>
    doc.latestVersion ?? undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            GED — Gestion Électronique des Documents
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Stockage structuré · Versioning · Archivage réglementaire
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Actualiser
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            + Nouveau document
          </button>
        </div>
      </div>

      {/* Download error notification */}
      {downloadError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <span className="text-lg mt-0.5">⚠</span>
          <div className="flex-1 text-sm">{downloadError}</div>
          <button onClick={() => setDownloadError('')} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total documents',   value: stats.totalDocuments,   color: 'text-slate-800' },
            { label: 'Documents actifs',  value: stats.documentsActifs ?? '—', color: 'text-green-600' },
            { label: 'Versions totales',  value: stats.versionsTotales ?? stats.totalVersions ?? 0, color: 'text-blue-600' },
            { label: 'Taille totale',     value: formatSize(stats.tailleTotale ?? (stats.totalSizeMB ? stats.totalSizeMB * 1024 * 1024 : 0)), color: 'text-indigo-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          {(Object.keys(TYPE_LABELS) as GedType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="ARCHIVE">Archivé</option>
        </select>

        <input
          type="text"
          value={filterTitre}
          onChange={e => setFilterTitre(e.target.value)}
          placeholder="Rechercher par titre..."
          className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Filtrer
        </button>
        {(filterType || filterStatut || filterTitre) && (
          <button
            onClick={() => { setFilterType(''); setFilterStatut(''); setFilterTitre(''); }}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : loading ? (
          <Spinner />
        ) : docs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Aucun document trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-semibold">Titre</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Entité liée</th>
                  <th className="text-center px-4 py-3 font-semibold">Version</th>
                  <th className="text-right px-4 py-3 font-semibold">Taille</th>
                  <th className="text-center px-4 py-3 font-semibold">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold">Date upload</th>
                  <th className="text-center px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {docs.map(doc => {
                  const ver = lastVersion(doc);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">
                        {doc.titre}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[doc.type]}`}>
                          {TYPE_LABELS[doc.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {doc.nomClient || doc.numeroPret || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          v{doc.versionActuelle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {ver ? formatSize(ver.taille) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.statut === 'ACTIF'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {doc.statut === 'ACTIF' ? 'Actif' : 'Archivé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 font-medium"
                          >
                            {downloading === doc.id ? '...' : 'Télécharger'}
                          </button>
                          {doc.statut === 'ACTIF' && (
                            <button
                              onClick={() => handleArchive(doc)}
                              disabled={archiving === doc.id}
                              className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 font-medium"
                            >
                              {archiving === doc.id ? '...' : 'Archiver'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
