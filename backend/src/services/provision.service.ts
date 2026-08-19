// Classification IFRS 9 / BCEAO des créances hypothécaires

export type ClassificationCreance = 'SAIN' | 'SOUS_SURVEILLANCE' | 'DOUTEUX' | 'CONTENTIEUX';

export const TAUX_PROVISION: Record<ClassificationCreance, number> = {
  SAIN: 0.01,
  SOUS_SURVEILLANCE: 0.05,
  DOUTEUX: 0.30,
  CONTENTIEUX: 1.00,
};

export const PD_PAR_CLASSE: Record<ClassificationCreance, number> = {
  SAIN: 0.005,
  SOUS_SURVEILLANCE: 0.05,
  DOUTEUX: 0.30,
  CONTENTIEUX: 1.00,
};

export function classifierCreance(
  ltv: number,
  ageExpertise: number,
  inscriptionPerimee: boolean,
  statutPret: string | null,
  impayes: number,
): ClassificationCreance {
  if (ltv > 120 || inscriptionPerimee || impayes >= 3) return 'CONTENTIEUX';
  if (ltv > 100 || ageExpertise > 5 || statutPret === 'EN_DEFAUT' || impayes >= 2) return 'DOUTEUX';
  if (ltv > 80 || ageExpertise > 3 || impayes >= 1) return 'SOUS_SURVEILLANCE';
  return 'SAIN';
}

export function calculerProvision(ead: number, vnc: number, classification: ClassificationCreance) {
  const lgd = ead > 0 ? Math.max(0, Math.min(1, (ead - Math.min(vnc, ead)) / ead)) : 0;
  const pd = PD_PAR_CLASSE[classification];
  const ecl = pd * lgd * ead;
  const provision = ead * TAUX_PROVISION[classification] * Math.max(lgd, 0.01); // min 1% even with full coverage
  return { lgd, pd, ecl, provision: Math.round(provision) };
}
