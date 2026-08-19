'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { hypothequesApi } from '@/lib/api';
import { formatFCFA, formatPercent } from '@/lib/format';
import type { Hypotheque } from '@/types';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';

// -------- Zod Schema --------
const schema = z.object({
  codeClient: z.string().min(1, 'Code client requis'),
  nomClient: z.string().min(2, 'Nom client requis'),
  numeroPret: z.string().min(1, 'Numéro prêt requis'),
  numeroTitreFoncier: z.string().min(1, 'N° titre foncier requis'),
  natureBien: z.enum(['TERRAIN_NU', 'VILLA', 'IMMEUBLE_RAPPORT', 'USINE', 'BUREAU']),
  ville: z.string().min(1, 'Ville requise'),
  quartier: z.string().optional(),
  lot: z.string().optional(),
  ilot: z.string().optional(),
  zoneGeographique: z.enum(['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_INDUSTRIELLE']),
  statutOccupation: z.enum(['LIBRE', 'OCCUPE_PROPRIETAIRE', 'LOUE_AVEC_BAIL']),
  valeurExpertiseInitiale: z.coerce.number().positive('Valeur doit être positive'),
  dateExpertise: z.string().min(1, 'Date expertise requise'),
  montantInscription: z.coerce.number().positive(),
  rangHypotheque: z.coerce.number().int().min(1).max(2) as z.ZodType<1 | 2>,
  datePeremptionInscription: z.string().min(1, 'Date péremption requise'),
  soldePret: z.coerce.number().positive('Solde prêt requis'),
  dateEcheancePret: z.string().optional(),
  latitude: z.preprocess(v => v === '' || v === undefined || v === null ? undefined : Number(v), z.number().min(-90).max(90).optional()),
  longitude: z.preprocess(v => v === '' || v === undefined || v === null ? undefined : Number(v), z.number().min(-180).max(180).optional()),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Hypotheque;
}

const STEPS = [
  { id: 1, title: 'Identification', fields: ['codeClient','nomClient','numeroPret','numeroTitreFoncier','natureBien'] },
  { id: 2, title: 'Localisation', fields: ['ville','quartier','lot','ilot','zoneGeographique','statutOccupation','latitude','longitude'] },
  { id: 3, title: 'Valeurs', fields: ['valeurExpertiseInitiale','dateExpertise','montantInscription','rangHypotheque','datePeremptionInscription','soldePret','dateEcheancePret'] },
];

function calcPreview(data: Partial<FormData>) {
  if (!data.valeurExpertiseInitiale || !data.zoneGeographique || !data.dateExpertise || !data.statutOccupation) return null;

  const decoteZone = data.zoneGeographique === 'ZONE_A' ? 20
    : data.zoneGeographique === 'ZONE_B' ? 30
    : data.zoneGeographique === 'ZONE_C' ? 45
    : 40; // ZONE_INDUSTRIELLE

  const now = new Date();
  const exp = new Date(data.dateExpertise);
  const ageYears = (now.getTime() - exp.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const decoteAnciennete = ageYears <= 3 ? 0 : ageYears <= 5 ? 10 : 100;

  const decoteOccupation = data.natureBien === 'TERRAIN_NU' ? 0
    : data.statutOccupation === 'LIBRE' ? 0
    : data.statutOccupation === 'OCCUPE_PROPRIETAIRE' ? 5
    : 15; // LOUE_AVEC_BAIL

  const decoteTotale = Math.min(decoteZone + decoteAnciennete + decoteOccupation, 100);
  const vnc = data.valeurExpertiseInitiale * (1 - decoteTotale / 100);
  const ltv = data.soldePret ? (data.soldePret / vnc) * 100 : 0;

  return { decoteZone, decoteAnciennete, decoteOccupation, decoteTotale, vnc, ltv };
}

export default function HypothequeForm({ initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const defaultValues: Partial<FormData> = initial
    ? {
        codeClient: initial.codeClient,
        nomClient: initial.nomClient,
        numeroPret: initial.numeroPret,
        numeroTitreFoncier: initial.numeroTitreFoncier,
        natureBien: initial.natureBien,
        ville: initial.ville,
        quartier: initial.quartier,
        lot: initial.lot,
        ilot: initial.ilot,
        zoneGeographique: initial.zoneGeographique,
        statutOccupation: initial.statutOccupation,
        valeurExpertiseInitiale: initial.valeurExpertiseInitiale,
        dateExpertise: initial.dateExpertise?.slice(0, 10),
        montantInscription: initial.montantInscription,
        rangHypotheque: initial.rangHypotheque,
        datePeremptionInscription: initial.datePeremptionInscription?.slice(0, 10),
        soldePret: initial.soldePret,
        dateEcheancePret: initial.dateEcheancePret?.slice(0, 10),
        latitude: (initial as unknown as { latitude?: number }).latitude ?? undefined,
        longitude: (initial as unknown as { longitude?: number }).longitude ?? undefined,
      }
    : { rangHypotheque: 1, zoneGeographique: 'ZONE_A', natureBien: 'VILLA', statutOccupation: 'OCCUPE_PROPRIETAIRE' };

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as Resolver<FormData, any>,
    defaultValues,
    mode: 'onBlur',
  });

  const watchValues = watch();
  const preview = calcPreview(watchValues);

  const validateStep = async () => {
    const fields = STEPS[step - 1].fields as (keyof FormData)[];
    return trigger(fields);
  };

  const nextStep = async () => {
    const ok = await validateStep();
    if (ok) setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setServerError('');
    try {
      if (initial) {
        await hypothequesApi.update(initial.id, data);
      } else {
        await hypothequesApi.create(data);
      }
      router.push('/hypotheques');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
      const msg = data?.message ?? data?.error ?? 'Erreur lors de la sauvegarde';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Step indicator */}
      <div className="card p-4">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}
                >
                  {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <span
                  className={`text-xs font-medium ${step === s.id ? 'text-blue-700' : step > s.id ? 'text-green-600' : 'text-slate-400'}`}
                >
                  {s.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`step-line mb-4 ${step > s.id ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1 */}
        {step === 1 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-1">Identification du Dossier</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code Client *" error={errors.codeClient?.message}>
                <input {...register('codeClient')} className="form-input" placeholder="C001234" />
              </Field>
              <Field label="Nom Client *" error={errors.nomClient?.message}>
                <input {...register('nomClient')} className="form-input" placeholder="Nom Complet" />
              </Field>
              <Field label="Numéro Prêt *" error={errors.numeroPret?.message}>
                <input {...register('numeroPret')} className="form-input" placeholder="PRE-2024-001" />
              </Field>
              <Field label="N° Titre Foncier *" error={errors.numeroTitreFoncier?.message}>
                <input {...register('numeroTitreFoncier')} className="form-input" placeholder="TF/ABJ/12345" />
              </Field>
              <Field label="Nature du Bien *" error={errors.natureBien?.message} className="col-span-2">
                <select {...register('natureBien')} className="form-input">
                  <option value="VILLA">Villa</option>
                  <option value="IMMEUBLE_RAPPORT">Immeuble de rapport</option>
                  <option value="TERRAIN_NU">Terrain nu</option>
                  <option value="BUREAU">Bureau / Local commercial</option>
                  <option value="USINE">Usine / Entrepôt</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-slate-800 mb-1">Localisation & Zone</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville *" error={errors.ville?.message}>
                <input {...register('ville')} className="form-input" placeholder="Abidjan" />
              </Field>
              <Field label="Quartier *" error={errors.quartier?.message}>
                <input {...register('quartier')} className="form-input" placeholder="Cocody" />
              </Field>
              <Field label="Lot" error={errors.lot?.message}>
                <input {...register('lot')} className="form-input" placeholder="Lot 12" />
              </Field>
              <Field label="Îlot" error={errors.ilot?.message}>
                <input {...register('ilot')} className="form-input" placeholder="Îlot A" />
              </Field>
              <Field label="Zone Géographique *" error={errors.zoneGeographique?.message}>
                <select {...register('zoneGeographique')} className="form-input">
                  <option value="ZONE_A">Zone A — Urbaine prime (décote 20%)</option>
                  <option value="ZONE_B">Zone B — Standard (décote 30%)</option>
                  <option value="ZONE_C">Zone C — Rurale (décote 45%)</option>
                  <option value="ZONE_INDUSTRIELLE">Zone Industrielle (décote 40%)</option>
                </select>
              </Field>
              <Field label="Statut Occupation *" error={errors.statutOccupation?.message}>
                <select {...register('statutOccupation')} className="form-input">
                  <option value="LIBRE">Libre / Vacant (décote 0%)</option>
                  <option value="OCCUPE_PROPRIETAIRE">Occupé propriétaire (décote 5%)</option>
                  <option value="LOUE_AVEC_BAIL">Loué avec bail (décote 15%)</option>
                </select>
              </Field>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                Coordonnées GPS — optionnelles, utilisées pour la carte des biens
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude" error={errors.latitude?.message}>
                  <input
                    {...register('latitude')}
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="14.6928"
                  />
                </Field>
                <Field label="Longitude" error={errors.longitude?.message}>
                  <input
                    {...register('longitude')}
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="-17.4467"
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Valeurs & Inscription</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valeur Expertise (FCFA) *" error={errors.valeurExpertiseInitiale?.message}>
                  <input
                    {...register('valeurExpertiseInitiale')}
                    type="number"
                    className="form-input"
                    placeholder="50000000"
                  />
                </Field>
                <Field label="Date Expertise *" error={errors.dateExpertise?.message}>
                  <input {...register('dateExpertise')} type="date" className="form-input" />
                </Field>
                <Field label="Montant Inscription (FCFA) *" error={errors.montantInscription?.message}>
                  <input
                    {...register('montantInscription')}
                    type="number"
                    className="form-input"
                    placeholder="50000000"
                  />
                </Field>
                <Field label="Rang Hypothèque *" error={errors.rangHypotheque?.message}>
                  <select {...register('rangHypotheque')} className="form-input">
                    <option value={1}>1er rang</option>
                    <option value={2}>2ème rang</option>
                  </select>
                </Field>
                <Field label="Date Péremption Inscription *" error={errors.datePeremptionInscription?.message}>
                  <input {...register('datePeremptionInscription')} type="date" className="form-input" />
                </Field>
                <Field label="Solde Prêt (FCFA) *" error={errors.soldePret?.message}>
                  <input
                    {...register('soldePret')}
                    type="number"
                    className="form-input"
                    placeholder="30000000"
                  />
                </Field>
                <Field label="Date d'échéance du prêt" error={errors.dateEcheancePret?.message}>
                  <input {...register('dateEcheancePret')} type="date" className="form-input" />
                </Field>
              </div>
            </div>

            {/* Live preview */}
            {preview && (
              <div className="card p-5 bg-blue-50 border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3 text-sm">
                  Aperçu des Calculs (Temps Réel)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <PreviewItem label="Décote Zone" value={formatPercent(preview.decoteZone)} />
                  <PreviewItem label="Décote Ancienneté" value={formatPercent(preview.decoteAnciennete)} />
                  <PreviewItem label="Décote Occupation" value={formatPercent(preview.decoteOccupation)} />
                  <PreviewItem label="Décote Totale" value={formatPercent(preview.decoteTotale)} highlight />
                  <PreviewItem label="VNC Estimée" value={formatFCFA(preview.vnc)} highlight />
                  <PreviewItem
                    label="LTV Ratio"
                    value={formatPercent(preview.ltv)}
                    highlight
                    danger={preview.ltv > 100}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={step === 1 ? () => router.push('/hypotheques') : prevStep}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-400"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {initial ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function PreviewItem({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`text-sm font-bold ${
          danger ? 'text-red-600' : highlight ? 'text-blue-700' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
