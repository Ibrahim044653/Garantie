'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Upload,
  X,
  AlertTriangle,
  Check,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { hypothequesApi } from '@/lib/api';
import { formatFCFA, formatDate, formatPercent } from '@/lib/format';

interface Reevaluation {
  id: number;
  dateExpertise: string;
  valeurExpertise: number;
  ancienneValeur: number;
  expertNom: string;
  expertAgreeId?: number;
  motif: string;
  observations?: string;
  createdAt: string;
  createdByName?: string;
}

interface ExpertAgree {
  id: number;
  nom: string;
  cabinet?: string;
  numeroAgrement: string;
}

const MOTIF_OPTIONS = [
  { value: 'BIENNALE', label: 'Réévaluation bisannuelle' },
  { value: 'SINISTRE', label: 'Réévaluation suite sinistre' },
  { value: 'MARCHE', label: 'Réévaluation marché' },
  { value: 'JUDICIAIRE', label: 'Expertise judiciaire' },
  { value: 'AUTRE', label: 'Autre' },
];

// Circulaire 04-2017 : VNC estimée = valeur * (1 - decoteTotale/100)
function estimateVnc(valeur: number, decoteTotale: number): number {
  return valeur * (1 - decoteTotale / 100);
}

export default function ReevaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [hyp, setHyp] = useState<{
    numeroTitreFoncier: string;
    valeurExpertiseInitiale: number;
    vnc: number;
    decoteTotale: number;
  } | null>(null);

  const [reevaluations, setReevaluations] = useState<Reevaluation[]>([]);
  const [experts, setExperts] = useState<ExpertAgree[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [dateExpertise, setDateExpertise] = useState('');
  const [valeurExpertise, setValeurExpertise] = useState('');
  const [expertNom, setExpertNom] = useState('');
  const [expertAgreeId, setExpertAgreeId] = useState('');
  const [motif, setMotif] = useState('');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      hypothequesApi.get(id),
      apiClient.get(`/hypotheques/${id}/reevaluations`),
      apiClient.get('/experts', { params: { statut: 'ACTIF' } }),
    ])
      .then(([hypRes, revalRes, expertsRes]) => {
        setHyp(hypRes.data);
        const revalList = Array.isArray(revalRes.data?.data)
          ? revalRes.data.data
          : Array.isArray(revalRes.data)
          ? revalRes.data
          : [];
        setReevaluations(revalList);
        const expertList = Array.isArray(expertsRes.data?.data)
          ? expertsRes.data.data
          : Array.isArray(expertsRes.data)
          ? expertsRes.data
          : [];
        setExperts(expertList);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [id]);

  // When expert selected from dropdown, auto-fill nom
  const handleExpertSelect = (expertId: string) => {
    setExpertAgreeId(expertId);
    if (expertId) {
      const found = experts.find((e) => e.id === Number(expertId));
      if (found) setExpertNom(found.nom);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd]);
    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    setUploading(true);
    try {
      const formData = new FormData();
      photos.forEach((f) => formData.append('photos', f));
      const res = await apiClient.post('/uploads/reevaluation-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const paths: string[] = Array.isArray(res.data?.paths)
        ? res.data.paths
        : Array.isArray(res.data)
        ? res.data
        : [];
      return paths;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const valeur = parseFloat(valeurExpertise);
    if (!dateExpertise) { setError('La date d\'expertise est requise.'); return; }
    if (isNaN(valeur) || valeur <= 0) { setError('La valeur expertise doit être un nombre positif.'); return; }
    if (!expertNom.trim()) { setError('Le nom de l\'expert est requis.'); return; }
    if (!motif) { setError('Le motif est requis.'); return; }

    setSaving(true);
    try {
      let paths = uploadedPaths;
      if (photos.length > 0) {
        paths = await uploadPhotos();
        setUploadedPaths(paths);
      }

      await apiClient.post(`/hypotheques/${id}/reevaluations`, {
        dateExpertise,
        valeurExpertise: valeur,
        expertNom: expertNom.trim(),
        expertAgreeId: expertAgreeId ? Number(expertAgreeId) : undefined,
        motif,
        observations: observations.trim() || undefined,
        photoPaths: paths.length > 0 ? paths : undefined,
      });

      setSuccess('Réévaluation enregistrée avec succès.');
      // Refresh list
      const revalRes = await apiClient.get(`/hypotheques/${id}/reevaluations`);
      const revalList = Array.isArray(revalRes.data?.data)
        ? revalRes.data.data
        : Array.isArray(revalRes.data)
        ? revalRes.data
        : [];
      setReevaluations(revalList);

      // Reset form
      setDateExpertise('');
      setValeurExpertise('');
      setExpertNom('');
      setExpertAgreeId('');
      setMotif('');
      setObservations('');
      setPhotos([]);
      setPhotoPreviews([]);
      setUploadedPaths([]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de l\'enregistrement';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Preview calc
  const valeurNum = parseFloat(valeurExpertise) || 0;
  const decoteTotale = hyp?.decoteTotale ?? 0;
  const estimatedVnc = valeurNum > 0 ? estimateVnc(valeurNum, decoteTotale) : null;
  const previousVnc = hyp?.vnc ?? 0;
  const vncDiff = estimatedVnc !== null ? estimatedVnc - previousVnc : null;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/hypotheques" className="hover:text-slate-700">Hypothèques</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/hypotheques/${id}`} className="hover:text-slate-700">
          {hyp?.numeroTitreFoncier ?? id}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Réévaluation</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/hypotheques/${id}`}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-violet-600" />
            Réévaluation de l&apos;hypothèque
          </h2>
          <p className="text-slate-500 text-sm">TF {hyp?.numeroTitreFoncier}</p>
        </div>
      </div>

      {/* Section 1: Historique */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-600" />
          Historique des réévaluations
        </h3>

        {reevaluations.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <RefreshCw className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium text-slate-500">Aucune réévaluation enregistrée</p>
            <p className="text-sm mt-1">La première réévaluation peut être saisie ci-dessous.</p>
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-4">
              {reevaluations.map((r) => {
                const delta = r.valeurExpertise - r.ancienneValeur;
                const positive = delta >= 0;
                return (
                  <div key={r.id} className="relative">
                    <div className="absolute -left-4 mt-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-white" />
                    <div className="card p-4 bg-slate-50 border border-slate-200">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {formatDate(r.dateExpertise)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Expert : {r.expertNom}
                            {r.createdByName && ` — Saisi par ${r.createdByName}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            Motif : {MOTIF_OPTIONS.find((m) => m.value === r.motif)?.label ?? r.motif}
                          </p>
                          {r.observations && (
                            <p className="text-xs text-slate-400 mt-1 italic">{r.observations}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
                            <span>{formatFCFA(r.ancienneValeur)}</span>
                            <span>→</span>
                            <span className="font-semibold text-slate-800">
                              {formatFCFA(r.valeurExpertise)}
                            </span>
                          </div>
                          <div
                            className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                              positive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {positive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {positive ? '+' : ''}{formatFCFA(delta)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <a
                          href={`/api/hypotheques/${id}/reevaluations/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Télécharger PDF historique →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Nouvelle réévaluation */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-600" />
          Nouvelle réévaluation
        </h3>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date expertise */}
            <div>
              <label className="form-label">Date d&apos;expertise *</label>
              <input
                type="date"
                value={dateExpertise}
                onChange={(e) => setDateExpertise(e.target.value)}
                className="form-input"
                required
                disabled={saving}
              />
            </div>

            {/* Valeur expertise */}
            <div>
              <label className="form-label">Valeur d&apos;expertise (FCFA) *</label>
              <input
                type="number"
                min={1}
                step={1}
                value={valeurExpertise}
                onChange={(e) => setValeurExpertise(e.target.value)}
                className="form-input"
                placeholder="ex: 45000000"
                required
                disabled={saving}
              />
            </div>

            {/* Expert nom */}
            <div>
              <label className="form-label">Nom de l&apos;expert *</label>
              <input
                type="text"
                value={expertNom}
                onChange={(e) => setExpertNom(e.target.value)}
                className="form-input"
                placeholder="Nom de l'expert"
                required
                disabled={saving}
              />
            </div>

            {/* Expert agréé (optionnel) */}
            <div>
              <label className="form-label">Expert agréé (optionnel)</label>
              <select
                value={expertAgreeId}
                onChange={(e) => handleExpertSelect(e.target.value)}
                className="form-input"
                disabled={saving}
              >
                <option value="">-- Sélectionner un expert agréé --</option>
                {experts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom} {e.cabinet ? `— ${e.cabinet}` : ''} (N° {e.numeroAgrement})
                  </option>
                ))}
              </select>
            </div>

            {/* Motif */}
            <div>
              <label className="form-label">Motif *</label>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="form-input"
                required
                disabled={saving}
              >
                <option value="">-- Sélectionner le motif --</option>
                {MOTIF_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="form-label">Observations</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="form-input resize-none"
              rows={3}
              placeholder="Observations complémentaires..."
              disabled={saving}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="form-label">Photos du bien (max 5, images uniquement)</label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Cliquer pour ajouter des photos ({photos.length}/5)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={photos.length >= 5 || saving}
            />
            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Photo ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview calcul VNC */}
          {estimatedVnc !== null && (
            <div className={`rounded-lg border p-4 ${vncDiff! >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Aperçu du calcul (Circulaire 04-2017)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">Décote totale</p>
                  <p className="text-sm font-bold text-slate-800">{formatPercent(decoteTotale)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nouvelle valeur</p>
                  <p className="text-sm font-bold text-slate-800">{formatFCFA(valeurNum)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">VNC estimée</p>
                  <p className={`text-sm font-bold ${vncDiff! >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatFCFA(estimatedVnc)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Variation VNC</p>
                  <div className={`flex items-center justify-center gap-1 text-sm font-bold ${vncDiff! >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {vncDiff! >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {vncDiff! >= 0 ? '+' : ''}{formatFCFA(vncDiff!)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * Estimation basée sur la décote totale actuelle. Le calcul exact sera effectué par le serveur.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/hypotheques/${id}`}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm text-center hover:bg-slate-100"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:bg-violet-400"
            >
              {saving || uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {uploading ? 'Upload photos...' : saving ? 'Enregistrement...' : 'Enregistrer la réévaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
