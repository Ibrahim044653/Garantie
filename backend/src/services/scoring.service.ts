export type NiveauScore = 'AAA' | 'BBB' | 'BB' | 'B' | 'CCC';

export const PD_PAR_NIVEAU: Record<NiveauScore, number> = {
  AAA: 0.005,
  BBB: 0.02,
  BB: 0.08,
  B: 0.20,
  CCC: 0.50,
};

export const LABEL_NIVEAU: Record<NiveauScore, string> = {
  AAA: 'Très faible risque',
  BBB: 'Faible risque',
  BB: 'Risque modéré',
  B: 'Risque élevé',
  CCC: 'Risque très élevé',
};

export function scorerLTV(ltv: number): number {
  if (ltv < 50) return 8;
  if (ltv < 70) return 6;
  if (ltv < 80) return 4;
  if (ltv <= 100) return 2;
  return 0;
}

export function scorerAge(ageAns: number): number {
  if (ageAns < 1) return 4;
  if (ageAns < 3) return 3;
  if (ageAns < 5) return 1;
  return 0;
}

export function scorerZone(zone: string): number {
  if (zone === 'ZONE_A') return 4;
  if (zone === 'ZONE_INDUSTRIELLE') return 3;
  if (zone === 'ZONE_B') return 2;
  return 0; // ZONE_C
}

export function scorerOccupation(statut: string): number {
  if (statut === 'LIBRE') return 2;
  if (statut === 'OCCUPE_PROPRIETAIRE') return 1;
  return 0;
}

export function scorerNature(nature: string): number {
  if (nature === 'VILLA' || nature === 'BUREAU') return 2;
  if (nature === 'IMMEUBLE_RAPPORT' || nature === 'USINE') return 1;
  return 0; // TERRAIN_NU
}

export function getNiveau(score: number): NiveauScore {
  if (score >= 17) return 'AAA';
  if (score >= 13) return 'BBB';
  if (score >= 9) return 'BB';
  if (score >= 5) return 'B';
  return 'CCC';
}

export function calculerScore(ltv: number, ageAns: number, zone: string, occupation: string, nature: string) {
  const scoreLTV = scorerLTV(ltv);
  const scoreAge = scorerAge(ageAns);
  const scoreZone = scorerZone(zone);
  const scoreOccupation = scorerOccupation(occupation);
  const scoreNature = scorerNature(nature);
  const total = scoreLTV + scoreAge + scoreZone + scoreOccupation + scoreNature;
  const niveau = getNiveau(total);
  return { score: total, niveau, detail: { scoreLTV, scoreAge, scoreZone, scoreOccupation, scoreNature } };
}
