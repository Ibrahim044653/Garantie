/**
 * Business Logic per Circulaire 04-2017
 * Gestion des Garanties Hypothécaires
 */

export interface DecoteResult {
  decoteZone: number;
  decoteAnciennete: number;
  decoteOccupation: number;
  decoteTotale: number;
  valeurNetteCouverture: number;
  loanToValue: number;
  hasShortfall: boolean;
}

/**
 * Decote Zone Géographique
 * ZONE_A (Urbaine Prime): 20%
 * ZONE_B (Standard):      30%
 * ZONE_C (Rurale):        45%
 */
export function getDecoteZone(zone: string): number {
  switch (zone) {
    case 'ZONE_A': return 20;
    case 'ZONE_B': return 30;
    case 'ZONE_C': return 45;
    default: return 30;
  }
}

/**
 * Decote Ancienneté (age de l'expertise)
 * 0-3 ans:  0%
 * 3-5 ans:  10%
 * > 5 ans:  100% (valeur nulle)
 */
export function getDecoteAnciennete(dateExpertise: Date): number {
  const today = new Date();
  const ageMs = today.getTime() - new Date(dateExpertise).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);

  if (ageYears <= 3) return 0;
  if (ageYears <= 5) return 10;
  return 100;
}

/**
 * Decote Occupation
 * LIBRE / TERRAIN_NU:        0%
 * OCCUPE_PROPRIETAIRE:       5%
 * LOUE_AVEC_BAIL:           15%
 */
export function getDecoteOccupation(statutOccupation: string, natureBien?: string): number {
  if (natureBien === 'TERRAIN_NU') return 0;
  switch (statutOccupation) {
    case 'LIBRE': return 0;
    case 'OCCUPE_PROPRIETAIRE': return 5;
    case 'LOUE_AVEC_BAIL': return 15;
    default: return 0;
  }
}

/**
 * Calculate all decotes and VNC
 */
export function calculerDecotes(
  valeurExpertise: number,
  dateExpertise: Date,
  zoneGeographique: string,
  statutOccupation: string,
  soldePret: number,
  natureBien?: string,
): DecoteResult {
  const decoteZone = getDecoteZone(zoneGeographique);
  const decoteAnciennete = getDecoteAnciennete(dateExpertise);
  const decoteOccupation = getDecoteOccupation(statutOccupation, natureBien);

  // Combined decote (additive per Circulaire 04-2017)
  const decoteTotale = Math.min(decoteZone + decoteAnciennete + decoteOccupation, 100);

  // Valeur Nette de Couverture
  const valeurNetteCouverture = valeurExpertise * (1 - decoteTotale / 100);

  // Loan-to-Value ratio
  const loanToValue = valeurNetteCouverture > 0
    ? (soldePret / valeurNetteCouverture) * 100
    : 999;

  return {
    decoteZone,
    decoteAnciennete,
    decoteOccupation,
    decoteTotale,
    valeurNetteCouverture,
    loanToValue,
    hasShortfall: soldePret > valeurNetteCouverture,
  };
}

/**
 * Get age of expertise in years
 */
export function getAgeExpertiseYears(dateExpertise: Date): number {
  const today = new Date();
  const ageMs = today.getTime() - new Date(dateExpertise).getTime();
  return ageMs / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Check if inscription is near expiry (within 6 months)
 */
export function isInscriptionNearExpiry(datePeremption: Date): boolean {
  const today = new Date();
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return new Date(datePeremption) <= sixMonthsFromNow;
}

/**
 * Check if inscription is expired
 */
export function isInscriptionExpired(datePeremption: Date): boolean {
  return new Date(datePeremption) < new Date();
}
