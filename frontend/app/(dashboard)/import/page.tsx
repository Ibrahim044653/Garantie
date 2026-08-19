'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, Users, CreditCard, CheckCircle2, XCircle, AlertTriangle, Download, RotateCcw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TEMPLATES, ImportType } from '@/components/import/ImportTemplates';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValidRow {
  rowIndex: number;
  data: Record<string, string | number>;
}

interface ErrorRow {
  rowIndex: number;
  errors: string[];
  data: Record<string, string>;
}

interface PreviewResult {
  valid: ValidRow[];
  errors: ErrorRow[];
  total: number;
  validCount: number;
  errorCount: number;
}

interface ConfirmResult {
  inserted: number;
  skipped: number;
}

type Step = 1 | 2 | 3 | 4;

// ─── Config types ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ImportType,
  { label: string; icon: React.ElementType; color: string; filename: string }
> = {
  hypotheques: {
    label: 'Hypothèques',
    icon: FileSpreadsheet,
    color: 'bg-blue-600 hover:bg-blue-700',
    filename: 'modele-hypotheques.csv',
  },
  clients: {
    label: 'Clients',
    icon: Users,
    color: 'bg-emerald-600 hover:bg-emerald-700',
    filename: 'modele-clients.csv',
  },
  prets: {
    label: 'Prêts',
    icon: CreditCard,
    color: 'bg-violet-600 hover:bg-violet-700',
    filename: 'modele-prets.csv',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function downloadTemplate(type: ImportType) {
  const csv = TEMPLATES[type];
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = TYPE_CONFIG[type].filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step, setStep] = useState<Step>(1);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [ignoreErrors, setIgnoreErrors] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAllValid, setShowAllValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1 handlers ────────────────────────────────────────────────────────

  function handleSelectType(type: ImportType) {
    setImportType(type);
    setStep(2);
    setFile(null);
    setPreview(null);
    setIgnoreErrors(false);
    setErrorMsg(null);
  }

  // ── Step 2 handlers ────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  async function handleAnalyze() {
    if (!file || !importType) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      const { data } = await apiClient.post<PreviewResult>('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error || "Erreur lors de l'analyse du fichier",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 3 handlers ────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!preview || !importType) return;
    const rowsToImport = ignoreErrors || preview.errorCount === 0
      ? preview.valid
      : preview.valid;

    if (rowsToImport.length === 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data } = await apiClient.post<ConfirmResult>('/import/confirm', {
        type: importType,
        rows: rowsToImport,
      });
      setConfirmResult(data);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Erreur lors de l'import");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setStep(1);
    setImportType(null);
    setFile(null);
    setPreview(null);
    setIgnoreErrors(false);
    setConfirmResult(null);
    setErrorMsg(null);
    setShowAllValid(false);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-400" />
          Import en masse
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Importez vos données depuis un fichier CSV ou Excel (.xlsx)
        </p>
      </div>

      {/* Stepper */}
      <Stepper step={step} />

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">
            Quel type de données voulez-vous importer ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.keys(TYPE_CONFIG) as ImportType[]).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleSelectType(type)}
                  className={`${cfg.color} transition-colors rounded-xl p-5 text-white flex flex-col items-center gap-3 font-medium`}
                >
                  <Icon className="w-8 h-8" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-700 pt-4">
            <p className="text-slate-400 text-sm mb-3">
              Téléchargez un modèle CSV pour démarrer :
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_CONFIG) as ImportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => downloadTemplate(type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {TYPE_CONFIG[type].filename}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && importType && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Importer des{' '}
              <span className="text-blue-400">{TYPE_CONFIG[importType].label}</span>
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Changer de type
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-400 bg-slate-800/50'
            }`}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            {file ? (
              <div className="space-y-1">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-400 text-sm">{formatFileSize(file.size)}</p>
              </div>
            ) : (
              <>
                <p className="text-white font-medium">
                  Glissez votre fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Formats acceptés : .csv, .xlsx, .xls — Max 10 Mo
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadTemplate(importType)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger le modèle
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Analyser le fichier
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && preview && importType && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div
            className={`card p-4 flex flex-wrap items-center gap-4 ${
              preview.errorCount === 0 ? 'border border-emerald-500/30' : 'border border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">{preview.validCount} ligne{preview.validCount > 1 ? 's' : ''} valide{preview.validCount > 1 ? 's' : ''}</span>
            </div>
            {preview.errorCount > 0 && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">{preview.errorCount} ligne{preview.errorCount > 1 ? 's' : ''} avec erreur{preview.errorCount > 1 ? 's' : ''}</span>
              </div>
            )}
            <span className="text-slate-400 text-sm ml-auto">
              Total : {preview.total} ligne{preview.total > 1 ? 's' : ''}
            </span>
          </div>

          {/* Errors table */}
          {preview.errorCount > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Lignes avec erreurs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium w-16">Ligne</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Données</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Erreurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((row) => (
                      <tr key={row.rowIndex} className="border-b border-slate-800">
                        <td className="py-2 px-3 text-slate-300 font-mono">{row.rowIndex}</td>
                        <td className="py-2 px-3 text-slate-300 max-w-xs truncate">
                          <span className="font-mono text-xs">
                            {Object.values(row.data).filter(Boolean).slice(0, 3).join(' · ')}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {row.errors.map((e, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.validCount > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={ignoreErrors}
                    onChange={(e) => setIgnoreErrors(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500"
                  />
                  Ignorer les erreurs et importer uniquement les {preview.validCount} lignes valides
                </label>
              )}
            </div>
          )}

          {/* Valid rows preview */}
          {preview.validCount > 0 && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Aperçu des lignes valides
                </h3>
                {preview.validCount > 5 && (
                  <button
                    onClick={() => setShowAllValid((v) => !v)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showAllValid ? 'Voir moins' : `Voir les ${preview.validCount} lignes`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium w-16">Ligne</th>
                      {Object.keys((preview.valid[0]?.data) ?? {}).slice(0, 5).map((k) => (
                        <th key={k} className="text-left py-2 px-3 text-slate-400 font-medium">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllValid ? preview.valid : preview.valid.slice(0, 5)).map((row) => (
                      <tr key={row.rowIndex} className="border-b border-slate-800">
                        <td className="py-2 px-3 text-slate-400 font-mono text-xs">{row.rowIndex}</td>
                        {Object.values(row.data).slice(0, 5).map((v, i) => (
                          <td key={i} className="py-2 px-3 text-slate-300 text-xs max-w-[150px] truncate">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Changer de fichier
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isLoading ||
                preview.validCount === 0 ||
                (preview.errorCount > 0 && !ignoreErrors)
              }
              className="ml-auto flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmer l&apos;import ({preview.validCount} lignes)
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && confirmResult && importType && (
        <div className="card p-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Import terminé</h2>
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{confirmResult.inserted}</p>
              <p className="text-slate-400 text-sm mt-1">enregistrement{confirmResult.inserted > 1 ? 's' : ''} créé{confirmResult.inserted > 1 ? 's' : ''}</p>
            </div>
            {confirmResult.skipped > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-400">{confirmResult.skipped}</p>
                <p className="text-slate-400 text-sm mt-1">doublon{confirmResult.skipped > 1 ? 's' : ''} ignoré{confirmResult.skipped > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`/${importType}`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Voir les {TYPE_CONFIG[importType].label.toLowerCase()} importé{importType === 'hypotheques' ? 'es' : 's'}
            </a>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importer un autre fichier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Type' },
    { n: 2, label: 'Fichier' },
    { n: 3, label: 'Validation' },
    { n: 4, label: 'Résultat' },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= n
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span
              className={`text-xs mt-1 transition-colors ${
                step >= n ? 'text-white' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mb-4 transition-colors ${
                step > n ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
