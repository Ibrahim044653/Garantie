import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculerDecotes, getAgeExpertiseYears } from '../services/calcul.service';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

interface AnnualReportRow {
  id: number;
  codeClient: string;
  nomClient: string;
  numeroPret: string;
  natureBien: string;
  ville: string;
  zoneGeographique: string;
  statutOccupation: string;
  valeurExpertise: number;
  dateExpertise: Date;
  ageExpertise: string;
  decoteZone: number;
  decoteAnciennete: number;
  decoteOccupation: number;
  decoteTotale: number;
  valeurNetteCouverture: number;
  soldePret: number;
  loanToValue: number;
  montantInscription: number;
  rangHypotheque: number;
  datePeremptionInscription: Date;
  statut: string;
  alertes: string[];
}

export const getAnnualReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prisma.hypotheque.findMany({
      include: { alertes: { where: { lu: false } } },
      orderBy: [{ zoneGeographique: 'asc' }, { nomClient: 'asc' }],
    });

    const rows: AnnualReportRow[] = hypotheques.map((h) => {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale,
        h.dateExpertise,
        h.zoneGeographique,
        h.statutOccupation,
        h.soldePret,
        h.natureBien,
      );

      const ageYears = getAgeExpertiseYears(h.dateExpertise);
      const ageStr = ageYears < 1
        ? `${Math.floor(ageYears * 12)} mois`
        : `${ageYears.toFixed(1)} ans`;

      const alertTypes = [...new Set(h.alertes.map((a) => a.type))];
      let statut = 'OK';
      if (d.hasShortfall) statut = 'SHORTFALL';
      else if (d.decoteAnciennete === 100) statut = 'EXPERTISE_EXPIREE';
      else if (d.loanToValue > 80) statut = 'RISQUE_ELEVE';
      else if (alertTypes.length > 0) statut = 'ALERTE';

      const vnc = Math.round(d.valeurNetteCouverture);
      const ltv = parseFloat(d.loanToValue.toFixed(2));
      return {
        id: h.id,
        numeroTitreFoncier: h.numeroTitreFoncier,
        codeClient: h.codeClient,
        nomClient: h.nomClient,
        numeroPret: h.numeroPret,
        natureBien: h.natureBien,
        ville: h.ville,
        zoneGeographique: h.zoneGeographique,
        statutOccupation: h.statutOccupation,
        valeurExpertise: h.valeurExpertiseInitiale,
        dateExpertise: h.dateExpertise,
        ageExpertise: ageStr,
        decoteZone: d.decoteZone,
        decoteAnciennete: d.decoteAnciennete,
        decoteOccupation: d.decoteOccupation,
        decoteTotale: d.decoteTotale,
        valeurNetteCouverture: vnc,
        vnc,
        soldePret: h.soldePret,
        loanToValue: ltv,
        ratioCouverture: ltv,
        montantInscription: h.montantInscription,
        rangHypotheque: h.rangHypotheque,
        datePeremptionInscription: h.datePeremptionInscription,
        statut,
        alerteShortfall: d.hasShortfall,
        alertes: alertTypes,
      };
    });

    // Summary stats
    const summary = {
      totalHypotheques: rows.length,
      vncTotale: rows.reduce((s, r) => s + r.valeurNetteCouverture, 0),
      soldeTotalPrets: rows.reduce((s, r) => s + r.soldePret, 0),
      ltvMoyen: rows.length > 0
        ? parseFloat((rows.reduce((s, r) => s + r.loanToValue, 0) / rows.length).toFixed(2))
        : 0,
      byZone: {
        ZONE_A: rows.filter((r) => r.zoneGeographique === 'ZONE_A').length,
        ZONE_B: rows.filter((r) => r.zoneGeographique === 'ZONE_B').length,
        ZONE_C: rows.filter((r) => r.zoneGeographique === 'ZONE_C').length,
      },
      byStatut: {
        OK: rows.filter((r) => r.statut === 'OK').length,
        SHORTFALL: rows.filter((r) => r.statut === 'SHORTFALL').length,
        EXPERTISE_EXPIREE: rows.filter((r) => r.statut === 'EXPERTISE_EXPIREE').length,
        RISQUE_ELEVE: rows.filter((r) => r.statut === 'RISQUE_ELEVE').length,
        ALERTE: rows.filter((r) => r.statut === 'ALERTE').length,
      },
      generatedAt: new Date().toISOString(),
      year: new Date().getFullYear(),
    };

    res.json({ summary, data: rows });
  } catch (err) {
    logger.error('getAnnualReport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportAnnualCSV = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prisma.hypotheque.findMany({
      include: { alertes: { where: { lu: false } } },
      orderBy: [{ zoneGeographique: 'asc' }, { nomClient: 'asc' }],
    });

    const headers = [
      'Code Client', 'Nom Client', 'Numéro Prêt', 'Titre Foncier', 'Nature Bien',
      'Ville', 'Zone', 'Statut Occupation', 'Valeur Expertise (FCFA)', 'Date Expertise',
      'Âge Expertise', 'Décote Zone (%)', 'Décote Ancienneté (%)', 'Décote Occupation (%)',
      'Décote Totale (%)', 'VNC (FCFA)', 'Solde Prêt (FCFA)', 'LTV (%)',
      'Montant Inscription (FCFA)', 'Rang', 'Date Péremption', 'Statut', 'Alertes',
    ];

    const rows = hypotheques.map((h) => {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale,
        h.dateExpertise,
        h.zoneGeographique,
        h.statutOccupation,
        h.soldePret,
        h.natureBien,
      );

      const ageYears = getAgeExpertiseYears(h.dateExpertise);
      const ageStr = ageYears < 1 ? `${Math.floor(ageYears * 12)} mois` : `${ageYears.toFixed(1)} ans`;
      const alertTypes = [...new Set(h.alertes.map((a) => a.type))].join('|');

      let statut = 'OK';
      if (d.hasShortfall) statut = 'SHORTFALL';
      else if (d.decoteAnciennete === 100) statut = 'EXPERTISE_EXPIREE';
      else if (d.loanToValue > 80) statut = 'RISQUE_ELEVE';
      else if (h.alertes.length > 0) statut = 'ALERTE';

      return [
        h.codeClient, h.nomClient, h.numeroPret, h.numeroTitreFoncier, h.natureBien,
        h.ville, h.zoneGeographique, h.statutOccupation,
        h.valeurExpertiseInitiale.toString(), h.dateExpertise.toLocaleDateString('fr-FR'),
        ageStr, d.decoteZone.toString(), d.decoteAnciennete.toString(), d.decoteOccupation.toString(),
        d.decoteTotale.toString(), Math.round(d.valeurNetteCouverture).toString(),
        h.soldePret.toString(), d.loanToValue.toFixed(2),
        h.montantInscription.toString(), h.rangHypotheque.toString(),
        h.datePeremptionInscription.toLocaleDateString('fr-FR'),
        statut, alertTypes,
      ].map((v) => `"${v}"`).join(';');
    });

    const csv = [headers.map((h) => `"${h}"`).join(';'), ...rows].join('\n');
    const filename = `rapport-hypotheques-${new Date().getFullYear()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM for Excel
  } catch (err) {
    logger.error('exportAnnualCSV error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
