export interface Echeance {
  numeroEcheance: number;
  dateEcheance: Date;
  capitalDu: number;
  interetsDus: number;
  montantTotal: number;
}

/**
 * Calcule le tableau d'amortissement selon le type choisi.
 * @param montant      Capital initial du prêt
 * @param tauxAnnuel   Taux annuel en pourcentage (ex: 6 pour 6 %)
 * @param dureeMois    Durée totale en mois
 * @param type         'LINEAIRE' | 'CONSTANT' | 'IN_FINE'
 * @param dateDebut    Date de la première échéance (Date JS)
 */
export function calculerAmortissement(
  montant: number,
  tauxAnnuel: number,
  dureeMois: number,
  type: 'LINEAIRE' | 'CONSTANT' | 'IN_FINE',
  dateDebut: Date,
): Echeance[] {
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const echeances: Echeance[] = [];

  if (type === 'LINEAIRE') {
    // Capital remboursé constant chaque mois = montant / dureeMois
    const capitalMensuel = montant / dureeMois;
    let capitalRestant = montant;

    for (let i = 1; i <= dureeMois; i++) {
      const interets = capitalRestant * tauxMensuel;
      const dateEcheance = addMonths(dateDebut, i);

      echeances.push({
        numeroEcheance: i,
        dateEcheance,
        capitalDu: round2(capitalRestant),
        interetsDus: round2(interets),
        montantTotal: round2(capitalMensuel + interets),
      });

      capitalRestant -= capitalMensuel;
    }
  } else if (type === 'CONSTANT') {
    // Mensualité constante (annuité constante)
    // Si taux = 0 → mensualité = montant / dureeMois
    let mensualite: number;
    if (tauxMensuel === 0) {
      mensualite = montant / dureeMois;
    } else {
      mensualite = montant * (tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -dureeMois)));
    }

    let capitalRestant = montant;

    for (let i = 1; i <= dureeMois; i++) {
      const interets = capitalRestant * tauxMensuel;
      const capital = mensualite - interets;
      const dateEcheance = addMonths(dateDebut, i);

      echeances.push({
        numeroEcheance: i,
        dateEcheance,
        capitalDu: round2(capitalRestant),
        interetsDus: round2(interets),
        montantTotal: round2(mensualite),
      });

      capitalRestant -= capital;
      // Eviter les dérives floating-point en fin de prêt
      if (capitalRestant < 0.005) capitalRestant = 0;
    }
  } else {
    // IN_FINE : intérêts seulement chaque mois, capital remboursé en totalité à la dernière échéance
    const interetsMensuels = montant * tauxMensuel;

    for (let i = 1; i <= dureeMois; i++) {
      const dateEcheance = addMonths(dateDebut, i);
      const estDerniereEcheance = i === dureeMois;

      echeances.push({
        numeroEcheance: i,
        dateEcheance,
        capitalDu: round2(montant),
        interetsDus: round2(interetsMensuels),
        montantTotal: estDerniereEcheance
          ? round2(montant + interetsMensuels)
          : round2(interetsMensuels),
      });
    }
  }

  return echeances;
}

/** Arrondit à 2 décimales */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Retourne une nouvelle Date décalée de +n mois */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
