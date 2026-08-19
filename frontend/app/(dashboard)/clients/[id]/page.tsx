'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Building2, Phone, Mail, MapPin, CreditCard, Home } from 'lucide-react';
import { clientsApi } from '@/lib/api';
import { formatFCFA } from '@/lib/format';
import type { Client, Pret, Hypotheque, StatutClient, StatutPret } from '@/types';

const STATUT_CLIENT_BADGE: Record<StatutClient, string> = {
  ACTIF: 'badge-success',
  INACTIF: 'badge-muted',
  BLACKLISTE: 'badge-danger',
};

const STATUT_PRET_BADGE: Record<StatutPret, string> = {
  ACTIF: 'badge-success',
  EN_DEFAUT: 'badge-danger',
  CLOTURE: 'badge-muted',
  RENEGOCIE: 'badge-info',
  SOLDE: 'badge-muted',
};

interface ClientDetail extends Client {
  prets?: Pret[];
  hypotheques?: Hypotheque[];
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await clientsApi.getById(id);
        setClient(res.data);
      } catch {
        setError('Impossible de charger la fiche client');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 font-medium">{error || 'Client introuvable'}</p>
        <button
          onClick={() => router.push('/clients')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const displayName = client.typeClient === 'ENTREPRISE'
    ? (client.raisonSociale ?? client.nom)
    : `${client.nom}${client.prenom ? ' ' + client.prenom : ''}`;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      {/* En-tête */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              {client.typeClient === 'ENTREPRISE'
                ? <Building2 className="w-6 h-6 text-blue-600" />
                : <User className="w-6 h-6 text-blue-600" />
              }
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{displayName}</h1>
              <p className="text-sm text-slate-500">{client.codeClient}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              client.typeClient === 'ENTREPRISE' ? 'badge-info' : 'badge-muted'
            }`}>
              {client.typeClient === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUT_CLIENT_BADGE[client.statut]}`}>
              {client.statut}
            </span>
          </div>
        </div>
      </div>

      {/* Grille infos + prêts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Informations */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Informations</h2>
          <dl className="space-y-3">
            {client.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500">Téléphone</dt>
                  <dd className="text-sm font-medium text-slate-700">{client.telephone}</dd>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="text-sm font-medium text-slate-700">{client.email}</dd>
                </div>
              </div>
            )}
            {(client.ville || client.adresse) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500">Adresse</dt>
                  <dd className="text-sm font-medium text-slate-700">
                    {[client.adresse, client.ville].filter(Boolean).join(', ')}
                  </dd>
                </div>
              </div>
            )}
            {client.numeroIdentite && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <dt className="text-xs text-slate-500">N° Identité</dt>
                  <dd className="text-sm font-medium text-slate-700">{client.numeroIdentite}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Prêts */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              Prêts ({client.prets?.length ?? 0})
            </h2>
          </div>
          {!client.prets?.length ? (
            <p className="text-sm text-slate-400">Aucun prêt associé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Prêt</th>
                    <th>Montant initial</th>
                    <th>Restant dû</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {client.prets.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-700">{p.numeroPret}</td>
                      <td className="tabular-nums">{formatFCFA(p.montantInitial)}</td>
                      <td className="tabular-nums">{formatFCFA(p.montantRestant)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUT_PRET_BADGE[p.statut]}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/prets/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Garanties / Hypothèques */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Garanties hypothécaires ({client.hypotheques?.length ?? 0})
          </h2>
        </div>
        {!client.hypotheques?.length ? (
          <p className="text-sm text-slate-400">Aucune garantie associée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Titre foncier</th>
                  <th>Nature</th>
                  <th>Ville</th>
                  <th>VNC</th>
                  <th>LTV</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {client.hypotheques.map((h) => (
                  <tr key={h.id}>
                    <td className="font-medium text-slate-700">{h.numeroTitreFoncier}</td>
                    <td className="text-sm">{h.natureBien}</td>
                    <td className="text-sm text-slate-600">{h.ville}</td>
                    <td className="tabular-nums">{formatFCFA(h.vnc)}</td>
                    <td>
                      <span className={`font-semibold text-sm ${
                        h.ltv > 100 ? 'text-red-600' : h.ltv > 80 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {h.ltv?.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        h.statut === 'A_JOUR' ? 'badge-success'
                        : h.statut === 'SHORTFALL' ? 'badge-danger'
                        : 'badge-warning'
                      }`}>
                        {h.statut}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/hypotheques/${h.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Voir
                      </Link>
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
