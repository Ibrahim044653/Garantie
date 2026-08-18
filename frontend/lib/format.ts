import { format, parseISO, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  NatureBien,
  StatutHypotheque,
  StatutOccupation,
  ZoneGeographique,
  AlerteType,
  AlerteSeverite,
  UserRole,
} from '@/types';

// ---------- FCFA Formatter ----------
export function formatFCFA(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('XOF', 'FCFA');
}

// ---------- Number Formatter ----------
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

// ---------- Percentage Formatter ----------
export function formatPercent(
  value: number | undefined | null,
  decimals = 1
): string {
  if (value === undefined || value === null) return '—';
  return `${value.toFixed(decimals)} %`;
}

// ---------- Date Formatters ----------
export function formatDate(
  dateStr: string | undefined | null,
  fmt = 'dd/MM/yyyy'
): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), fmt, { locale: fr });
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string | undefined | null): string {
  return formatDate(dateStr, 'dd MMMM yyyy');
}

// ---------- Expertise Age ----------
export function expertiseAgeMonths(dateExpertise: string): number {
  try {
    return differenceInMonths(new Date(), parseISO(dateExpertise));
  } catch {
    return 0;
  }
}

// ---------- Label Maps ----------
export const NATURE_LABELS: Record<NatureBien, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  TERRAIN: 'Terrain',
  LOCAL_COMMERCIAL: 'Local Commercial',
  IMMEUBLE: 'Immeuble',
};

export const STATUT_LABELS: Record<StatutHypotheque, string> = {
  A_JOUR: 'À jour',
  EXPERTISE_OBSOLETE: 'Expertise Obsolète',
  SHORTFALL: 'Shortfall',
};

export const STATUT_COLORS: Record<StatutHypotheque, string> = {
  A_JOUR: 'badge-success',
  EXPERTISE_OBSOLETE: 'badge-danger',
  SHORTFALL: 'badge-warning',
};

export const OCCUPATION_LABELS: Record<StatutOccupation, string> = {
  OCCUPE_PROPRIETAIRE: 'Occupé (Propriétaire)',
  LOUE: 'Loué',
  VACANT: 'Vacant',
};

export const ZONE_LABELS: Record<ZoneGeographique, string> = {
  A: 'Zone A',
  B: 'Zone B',
  C: 'Zone C',
  ZONE_INDUSTRIELLE: 'Zone Industrielle (Spécifique)',
};

export const ALERTE_TYPE_LABELS: Record<AlerteType, string> = {
  SHORTFALL: 'Shortfall',
  EXPERTISE_OBSOLETE: 'Expertise Obsolète',
  PEREMPTION_INSCRIPTION: 'Péremption Inscription',
  LTV_ELEVEE: 'LTV Élevée',
  EXPERTISE_RENOUVELLEMENT: 'Renouvellement expertise',
};

export const SEVERITE_LABELS: Record<AlerteSeverite, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE_RISQUES: 'Responsable Risques',
  CHARGE_CLIENTELE: 'Chargé de Clientèle',
  ENGAGEMENTS: 'Engagements',
  AUDIT_INTERNE: 'Audit Interne',
};

export const RANG_LABELS: Record<1 | 2, string> = {
  1: '1er rang',
  2: '2ème rang',
};
