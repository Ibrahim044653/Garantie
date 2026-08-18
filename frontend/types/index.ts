export type UserRole =
  | 'ADMIN'
  | 'GESTIONNAIRE_GARANTIES'
  | 'RESPONSABLE_RISQUES'
  | 'ENGAGEMENTS'
  | 'AUDIT_INTERNE';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: UserRole;
  mfaEnabled?: boolean;
}

export type NatureBien =
  | 'VILLA'
  | 'APPARTEMENT'
  | 'TERRAIN'
  | 'LOCAL_COMMERCIAL'
  | 'IMMEUBLE';

export type ZoneGeographique = 'A' | 'B' | 'C' | 'ZONE_INDUSTRIELLE';

export type StatutOccupation =
  | 'OCCUPE_PROPRIETAIRE'
  | 'LOUE'
  | 'VACANT';

export type StatutHypotheque =
  | 'A_JOUR'
  | 'EXPERTISE_OBSOLETE'
  | 'SHORTFALL';

export interface Hypotheque {
  id: number;
  codeClient: string;
  nomClient: string;
  numeroPret: string;
  numeroTitreFoncier: string;
  natureBien: NatureBien;
  ville: string;
  quartier: string;
  lot?: string;
  ilot?: string;
  zoneGeographique: ZoneGeographique;
  statutOccupation: StatutOccupation;
  valeurExpertiseInitiale: number;
  dateExpertise: string;
  montantInscription: number;
  rangHypotheque: 1 | 2;
  datePeremptionInscription: string;
  soldePret: number;
  dateEcheancePret?: string;
  vnc: number;
  ltv: number;
  decoteZone: number;
  decoteAnciennete: number;
  decoteOccupation: number;
  decoteTotale: number;
  statut: StatutHypotheque;
  alertes?: Alerte[];
  createdAt: string;
  updatedAt: string;
}

export type AlerteType =
  | 'SHORTFALL'
  | 'EXPERTISE_OBSOLETE'
  | 'PEREMPTION_INSCRIPTION'
  | 'LTV_ELEVEE'
  | 'EXPERTISE_RENOUVELLEMENT';

export type AlerteSeverite = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlerteStatut = 'NON_LU' | 'LU';

export interface Alerte {
  id: number;
  type: AlerteType;
  hypothequeId: number;
  hypotheque?: Pick<Hypotheque, 'id' | 'numeroTitreFoncier' | 'nomClient'>;
  message: string;
  severite: AlerteSeverite;
  statut: AlerteStatut;
  createdAt: string;
}

export interface DashboardStats {
  totalHypotheques: number;
  vncTotale: number;
  alertesActives: number;
  ltvMoyen: number;
  evolutionVNC: { mois: string; vnc: number }[];
  repartitionZone: { zone: string; count: number; vnc: number }[];
  repartitionNature: { nature: string; count: number }[];
  topShortfall: Hypotheque[];
  alertesRecentes: Alerte[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface HypothequeFormData {
  codeClient: string;
  nomClient: string;
  numeroPret: string;
  numeroTitreFoncier: string;
  natureBien: NatureBien;
  ville: string;
  quartier: string;
  lot?: string;
  ilot?: string;
  zoneGeographique: ZoneGeographique;
  statutOccupation: StatutOccupation;
  valeurExpertiseInitiale: number;
  dateExpertise: string;
  montantInscription: number;
  rangHypotheque: 1 | 2;
  datePeremptionInscription: string;
  soldePret: number;
  dateEcheancePret?: string;
}

export interface HypothequeFilters {
  search?: string;
  zone?: ZoneGeographique;
  nature?: NatureBien;
  statutOccupation?: StatutOccupation;
  statut?: StatutHypotheque;
  alerte?: boolean;
  page?: number;
  limit?: number;
}

export interface ReportingRow {
  id: number;
  numeroTitreFoncier: string;
  nomClient: string;
  valeurExpertise: number;
  dateExpertise: string;
  decoteTotale: number;
  vnc: number;
  statut: StatutHypotheque;
  ratioCouverture: number;
  alerteShortfall: boolean;
}

export interface UserFormData {
  nom: string;
  email: string;
  password?: string;
  role: UserRole;
}
