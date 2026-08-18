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
  natureBien: z.enum(['VILLA', 'APPARTEMENT', 'TERRAIN', 'LOCAL_COMMERCIAL', 'IMMEUBLE']),
  ville: z.string().min(1, 'Ville requise'),
  quartier: z.string().min(1, 'Quartier requis'),
  lot: z.string().optional(),
  ilot: z.string().optional(),
  zoneGeographique: z.enum(['A', 'B', 'C']),
  statutOccupation: z.enum(['OCCUPE_PROPRIETAIRE', 'LOUE', 'VACANT']),
  valeurExpertiseInitiale: z.coerce.number().positive('Valeur doit être positive'),
  dateExpertise: z.string().min(1, 'Date expertise requise'),
  montantInscription: z.coerce.number().positive(),
  rangHypotheque: z.coerce.number().int().min(1).max(2) as z.ZodType<1 | 2>,
  datePeremptionInscription: z.string().min(1, 'Date péremption requise'),
  soldePret: z.coerce.number().positive('Solde prêt requis'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Hypotheque;
}

const STEPS = [
  { id: 1, title: 'Identification', fields: ['codeClient','nomClient','numeroPret','numeroTitreFoncier','natureBien'] },
  { id: 2, title: 'Localisation', fields: ['ville','quartier','lot','ilot','zoneGeographique','statutOccupation'] },
  { id: 3, title: 'Valeurs', fields: ['valeurExpertiseInitiale','dateExpertise','montantInscription','rangHypotheque','datePeremptionInscription','soldePret'] },
];

function calcPreview(data: Partial<FormData>) {
  if (!data.valeurExpertiseInitiale || !data.zoneGeographique || !data.dateExpertise || !data.statutOccupation) return null;

  const decoteZone = data.zoneGeographique === 'A' ? 0 : data.zoneGeographique === 'B' ? 20 : 40;

  const now = new Date();
  const exp = new Date(data.dateExpertise);
  const months = Math.max(0, (now.getFullYear() - exp.getFullYear()) * 12 + now.getMonth() - exp.getMonth());
  const decoteAnciennete = months <= 36 ? 0 : months <= 60 ? 10 : months <= 84 ? 15 : 20;

  const decoteOccupation = data.statutOccupation === 'OCCUPE_PROPRIETAIRE' ? 0
    : data.statutOccupation === 'LOUE' ? 15 : 25;

  const decoteTotale = Math.min(decoteZone + decoteAnciennete + decoteOccupation, 60);
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
      }
    : { rangHypotheque: 1, zoneGeographique: 'A', natureBien: 'VILLA', statutOccupation: 'OCCUPE_PROPRIETAIRE' };

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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Erreur lors de la sauvegarde';
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
                  <option value="APPARTEMENT">Appartement</option>
                  <option value="TERRAIN">Terrain</option>
                  <option value="LOCAL_COMMERCIAL">Local Commercial</option>
                  <option value="IMMEUBLE">Immeuble</option>
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
                  <option value="A">Zone A (principale)</option>
                  <option value="B">Zone B (secondaire)</option>
                  <option value="C">Zone C (rurale)</option>
                </select>
              </Field>
              <Field label="Statut Occupation *" error={errors.statutOccupation?.message}>
                <select {...register('statutOccupation')} className="form-input">
                  <option value="OCCUPE_PROPRIETAIRE">Occupé (Propriétaire)</option>
                  <option value="LOUE">Loué</option>
                  <option value="VACANT">Vacant</option>
                </select>
              </Field>
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
