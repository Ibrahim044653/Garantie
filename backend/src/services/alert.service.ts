import { PrismaClient, AlertType } from '@prisma/client';
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
export async function generateAlerts(): Promise<Array<{ type: string; hypotheque: any }>> {
  const hypotheques = await prisma.hypotheque.findMany();
  const today = new Date();
  let created = 0;
  const triggeredNotifications: Array<{ type: string; hypotheque: any }> = [];

  for (const h of hypotheques) {
    // Delete existing unread alerts for this hypotheque to avoid duplicates
    await prisma.alert.deleteMany({
      where: { hypothequeId: h.id, lu: false },
    });

    const alerts: Array<{
      type: AlertType;
      message: string;
      dateEcheance?: Date;
    }> = [];

    const ageYears = getAgeExpertiseYears(h.dateExpertise);
    const decotes = calculerDecotes(
      Number(h.valeurExpertiseInitiale),
      h.dateExpertise,
      h.zoneGeographique,
      h.statutOccupation,
      Number(h.soldePret),
      h.natureBien,
    );

    // 1. Expertise expirée (> 5 ans) — valeur nulle CB
    if (ageYears > 5) {
      alerts.push({
        type: 'EXPERTISE_EXPIREE',
        message: `L'expertise du bien de ${h.nomClient} (${h.numeroPret}) est expirée depuis plus de 5 ans. Valeur nulle selon Circulaire 04-2017.`,
        dateEcheance: h.dateExpertise,
      });
    }
    // 2. Expertise à réévaluer (3 à 5 ans — décote ancienneté 10%)
    else if (ageYears > 3) {
      alerts.push({
        type: 'EXPERTISE_BIENTOT_EXPIREE',
        message: `L'expertise du bien de ${h.nomClient} (${h.numeroPret}) a plus de 3 ans (décote ancienneté +10%). Réévaluation urgente requise selon Circulaire 04-2017.`,
        dateEcheance: h.dateExpertise,
      });
    }
    // 3. Alerte préventive bisannuelle : 3 mois avant la limite de 2 ans (TDR SIB)
    else if (ageYears >= (24 - 3) / 12) {
      const dateRenewal = new Date(h.dateExpertise);
      dateRenewal.setFullYear(dateRenewal.getFullYear() + 2);
      alerts.push({
        type: 'EXPERTISE_RENOUVELLEMENT',
        message: `L'expertise du bien de ${h.nomClient} (${h.numeroPret}) atteindra 2 ans le ${dateRenewal.toLocaleDateString('fr-FR')}. Planifier la réévaluation bisannuelle (Circulaire 04-2017, Art. 3).`,
        dateEcheance: dateRenewal,
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
      const gap = (Number(h.soldePret) - decotes.valeurNetteCouverture).toLocaleString('fr-FR');
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
      for (const a of alerts) {
        triggeredNotifications.push({ type: a.type, hypotheque: h });
      }
    }
  }

  logger.info(`Alert generation: ${created} alerts created for ${hypotheques.length} hypothèques`);
  return triggeredNotifications;
}
