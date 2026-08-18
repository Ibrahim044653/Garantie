import { PrismaClient } from '@prisma/client';
import {
  calculerDecotes,
  getAgeExpertiseYears,
  isInscriptionNearExpiry,
  isInscriptionExpired,
} from './calcul.service';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Generate alerts for all hypothèques.
 * - Clears existing unread alerts for a hypotheque before regenerating.
 */
export async function generateAlerts(): Promise<void> {
  const hypotheques = await prisma.hypotheque.findMany();
  const today = new Date();
  let created = 0;

  for (const h of hypotheques) {
    // Delete existing unread alerts for this hypotheque to avoid duplicates
    await prisma.alert.deleteMany({
      where: { hypothequeId: h.id, lu: false },
    });

    const alerts: Array<{
      type: string;
      message: string;
      dateEcheance?: Date;
    }> = [];

    const ageYears = getAgeExpertiseYears(h.dateExpertise);
    const decotes = calculerDecotes(
      h.valeurExpertiseInitiale,
      h.dateExpertise,
      h.zoneGeographique,
      h.statutOccupation,
      h.soldePret,
      h.natureBien,
    );

    // 1. Expertise expirée (> 5 ans)
    if (ageYears > 5) {
      alerts.push({
        type: 'EXPERTISE_EXPIREE',
        message: `L'expertise du bien de ${h.nomClient} (${h.numeroPret}) est expirée depuis plus de 5 ans. Valeur nulle selon Circulaire 04-2017.`,
        dateEcheance: h.dateExpertise,
      });
    }
    // 2. Expertise bientôt expirée (3 à 5 ans)
    else if (ageYears > 3) {
      alerts.push({
        type: 'EXPERTISE_BIENTOT_EXPIREE',
        message: `L'expertise du bien de ${h.nomClient} (${h.numeroPret}) a plus de 3 ans. Une réévaluation est recommandée.`,
        dateEcheance: h.dateExpertise,
      });
    }

    // 3. Inscription périmée ou proche péremption
    if (isInscriptionExpired(h.datePeremptionInscription)) {
      alerts.push({
        type: 'INSCRIPTION_PERIMEE',
        message: `L'inscription hypothécaire de ${h.nomClient} (${h.numeroPret}) est périmée depuis le ${h.datePeremptionInscription.toLocaleDateString('fr-FR')}.`,
        dateEcheance: h.datePeremptionInscription,
      });
    } else if (isInscriptionNearExpiry(h.datePeremptionInscription)) {
      alerts.push({
        type: 'INSCRIPTION_PERIMEE',
        message: `L'inscription hypothécaire de ${h.nomClient} (${h.numeroPret}) expire dans moins de 6 mois (${h.datePeremptionInscription.toLocaleDateString('fr-FR')}).`,
        dateEcheance: h.datePeremptionInscription,
      });
    }

    // 4. Shortfall (LTV > 100%)
    if (decotes.hasShortfall) {
      const gap = (h.soldePret - decotes.valeurNetteCouverture).toLocaleString('fr-FR');
      alerts.push({
        type: 'SHORTFALL',
        message: `Insuffisance de couverture pour ${h.nomClient} (${h.numeroPret}). Solde prêt dépasse la VNC de ${gap} FCFA. LTV: ${decotes.loanToValue.toFixed(1)}%.`,
        dateEcheance: today,
      });
    }

    if (alerts.length > 0) {
      await prisma.alert.createMany({
        data: alerts.map((a) => ({
          hypothequeId: h.id,
          type: a.type,
          message: a.message,
          dateEcheance: a.dateEcheance,
          lu: false,
        })),
      });
      created += alerts.length;
    }
  }

  logger.info(`Alert generation: ${created} alerts created for ${hypotheques.length} hypothèques`);
}
