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

// ─── CRM ───────────────────────────────────────────────────────────────────────
export type TypeClient = 'PARTICULIER' | 'ENTREPRISE';
export type StatutClient = 'ACTIF' | 'INACTIF' | 'BLACKLISTE';

export interface Client {
  id: number;
  codeClient: string;
  typeClient: TypeClient;
  nom: string;
  prenom?: string;
  raisonSociale?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  numeroIdentite?: string;
  statut: StatutClient;
  _count?: {
    prets: number;
    hypotheques: number;
  };
}

// ─── Prêts ─────────────────────────────────────────────────────────────────────
export type StatutPret = 'ACTIF' | 'EN_DEFAUT' | 'CLOTURE' | 'RENEGOCIE' | 'SOLDE';
export type TypeAmortissement = 'LINEAIRE' | 'CONSTANT' | 'IN_FINE';
export type StatutEcheance = 'EN_ATTENTE' | 'PAYE' | 'PARTIEL' | 'IMPAYE';

export interface Pret {
  id: number;
  numeroPret: string;
  clientId: number;
  montantInitial: number;
  montantRestant: number;
  tauxInteret: number;
  dureeMois: number;
  typeAmortissement: TypeAmortissement;
  dateDebut: string;
  dateFin: string;
  statut: StatutPret;
  objet?: string;
  client?: Client;
}

export interface EcheancePret {
  id: number;
  pretId: number;
  numeroEcheance: number;
  dateEcheance: string;
  capitalDu: number;
  interetsDus: number;
  montantTotal: number;
  capitalRembourse: number;
  interetsRembourses: number;
  penalites: number;
  montantPaye: number;
  statut: StatutEcheance;
  datePaiement?: string;
}

// ─── Workflow ──────────────────────────────────────────────────────────────────
export type StatutDemande = 'EN_ATTENTE' | 'EN_COURS' | 'APPROUVE' | 'REJETE' | 'ANNULE';
export type TypeDemande =
  | 'CREATION_HYPOTHEQUE'
  | 'REEVALUATION'
  | 'RADIATION'
  | 'CREATION_PRET'
  | 'MODIFICATION_PRET';

export interface EtapeValidation {
  id: number;
  demandeId: number;
  numeroEtape: number;
  libelle: string;
  roleRequis: UserRole;
  valideurId?: number;
  statut: StatutDemande;
  commentaire?: string;
  dateTraitement?: string;
}

export interface DemandeValidation {
  id: number;
  type: TypeDemande;
  entiteId: number;
  entiteType: string;
  titre: string;
  description?: string;
  statut: StatutDemande;
  createurId: number;
  etapeActuelle: number;
  totalEtapes: number;
  etapes?: EtapeValidation[];
  createdAt: string;
  createur?: { nom: string; email: string };
}
