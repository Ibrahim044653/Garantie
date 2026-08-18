'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mfaApi } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/format';
import {
  User,
  ShieldCheck,
  ShieldOff,
  QrCode,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

export default function ProfilPage() {
  const { user, logout } = useAuth();

  // MFA setup flow
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'confirm' | 'done'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmToken, setConfirmToken] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  // MFA disable flow
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  const handleSetupMfa = async () => {
    setSetupError('');
    setSetupSuccess('');
    setSetupLoading(true);
    try {
      const res = await mfaApi.setup();
      setQrCode(res.data.qrCode ?? '');
      setSecret(res.data.secret ?? '');
      setSetupStep('qr');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Erreur lors de la configuration MFA';
      setSetupError(msg);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!confirmToken || confirmToken.length !== 6) {
      setSetupError('Veuillez saisir un code à 6 chiffres.');
      return;
    }
    setSetupLoading(true);
    try {
      await mfaApi.confirm(confirmToken);
      setSetupStep('done');
      setSetupSuccess('MFA activé avec succès !');
      // Update the local user cache so mfaEnabled reflects the new state
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          localStorage.setItem('user', JSON.stringify({ ...u, mfaEnabled: true }));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Code incorrect. Veuillez réessayer.';
      setSetupError(msg);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm('Désactiver la double authentification ? Votre compte sera moins protégé.')) return;
    setDisableError('');
    setDisableLoading(true);
    try {
      await mfaApi.disable();
      setSetupStep('idle');
      setSetupSuccess('MFA désactivé.');
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          localStorage.setItem('user', JSON.stringify({ ...u, mfaEnabled: false }));
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Erreur lors de la désactivation';
      setDisableError(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  if (!user) return null;

  const mfaEnabled = user.mfaEnabled ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* User info card */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Informations du compte
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">Nom</p>
            <p className="text-sm text-slate-800 font-semibold mt-0.5">{user.nom}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Email</p>
            <p className="text-sm text-slate-800 font-semibold mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Rôle</p>
            <p className="text-sm text-slate-800 font-semibold mt-0.5">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
        </div>
      </div>

      {/* MFA section */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Double authentification (MFA)
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Renforcez la sécurité de votre compte avec une application d&apos;authentification (Google Authenticator, Authy…).
        </p>

        {/* Success message */}
        {setupSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">
            <Check className="w-4 h-4 flex-shrink-0" />
            {setupSuccess}
          </div>
        )}

        {/* Setup error */}
        {setupError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {setupError}
          </div>
        )}

        {/* Disable error */}
        {disableError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {disableError}
          </div>
        )}

        {/* Statut */}
        {setupStep === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
              {mfaEnabled ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">MFA activé</p>
                    <p className="text-xs text-slate-500">
                      Votre compte est protégé par la double authentification.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">MFA non activé</p>
                    <p className="text-xs text-slate-500">
                      Activez le MFA pour sécuriser davantage votre compte.
                    </p>
                  </div>
                </>
              )}
            </div>

            {mfaEnabled ? (
              <button
                onClick={handleDisableMfa}
                disabled={disableLoading}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60"
              >
                {disableLoading ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
                Désactiver le MFA
              </button>
            ) : (
              <button
                onClick={handleSetupMfa}
                disabled={setupLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-blue-400"
              >
                {setupLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Configurer le MFA
              </button>
            )}
          </div>
        )}

        {/* QR code display */}
        {setupStep === 'qr' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Scannez ce QR code avec votre application d&apos;authentification :
              </p>
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCode}
                  alt="QR Code MFA"
                  className="mx-auto w-48 h-48 rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center w-48 h-48 mx-auto bg-white rounded-lg border border-slate-200">
                  <QrCode className="w-16 h-16 text-slate-300" />
                </div>
              )}
              {secret && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1">Clé secrète (saisie manuelle) :</p>
                  <code className="text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 select-all">
                    {secret}
                  </code>
                </div>
              )}
            </div>

            <button
              onClick={() => { setSetupStep('confirm'); setSetupError(''); }}
              className="w-full py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              J&apos;ai scanné le code — Continuer
            </button>
            <button
              onClick={() => { setSetupStep('idle'); setSetupError(''); }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 text-center"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Confirm TOTP */}
        {setupStep === 'confirm' && (
          <form onSubmit={handleConfirmMfa} className="space-y-4">
            <div>
              <label className="form-label">
                Code de vérification (6 chiffres)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value.replace(/\D/g, ''))}
                className="form-input tracking-widest text-center text-xl font-mono"
                placeholder="123456"
                autoFocus
                disabled={setupLoading}
              />
              <p className="text-xs text-slate-400 mt-1">
                Saisissez le code affiché dans votre application d&apos;authentification.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setSetupStep('qr'); setSetupError(''); }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
              >
                <X className="w-4 h-4 inline mr-1" />
                Retour
              </button>
              <button
                type="submit"
                disabled={setupLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-blue-400"
              >
                {setupLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirmer l&apos;activation
              </button>
            </div>
          </form>
        )}

        {/* Done state */}
        {setupStep === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">MFA activé avec succès</p>
                <p className="text-xs text-slate-500">
                  À votre prochaine connexion, un code TOTP vous sera demandé.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setSetupStep('idle'); setSetupSuccess(''); }}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              <ShieldOff className="w-4 h-4" />
              Désactiver le MFA
            </button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-6 border border-red-100">
        <h3 className="font-semibold text-slate-800 mb-1">Zone de danger</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ces actions sont irréversibles. Agissez avec précaution.
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
