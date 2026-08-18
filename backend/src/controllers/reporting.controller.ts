import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
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

export const exportAnnualExcel = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prisma.hypotheque.findMany({
      include: { alertes: { where: { lu: false } } },
      orderBy: [{ zoneGeographique: 'asc' }, { nomClient: 'asc' }],
    });

    const year = new Date().getFullYear();

    // Sheet 1 — Détail
    const detail = hypotheques.map((h) => {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale, h.dateExpertise, h.zoneGeographique,
        h.statutOccupation, h.soldePret, h.natureBien,
      );
      const ageYears = getAgeExpertiseYears(h.dateExpertise);
      const ageStr = ageYears < 1
        ? `${Math.floor(ageYears * 12)} mois`
        : `${ageYears.toFixed(1)} ans`;

      let statut = 'OK';
      if (d.hasShortfall) statut = 'SHORTFALL';
      else if (d.decoteAnciennete === 100) statut = 'EXPERTISE_EXPIREE';
      else if (d.loanToValue > 80) statut = 'RISQUE_ELEVE';
      else if (h.alertes.length > 0) statut = 'ALERTE';

      return {
        'Code Client': h.codeClient,
        'Nom Client': h.nomClient,
        'N° Prêt': h.numeroPret,
        'Titre Foncier': h.numeroTitreFoncier,
        'Nature Bien': h.natureBien,
        'Ville': h.ville,
        'Zone': h.zoneGeographique,
        'Statut Occupation': h.statutOccupation,
        'Valeur Expertise (FCFA)': h.valeurExpertiseInitiale,
        'Date Expertise': h.dateExpertise.toLocaleDateString('fr-FR'),
        'Âge Expertise': ageStr,
        'Décote Zone (%)': d.decoteZone,
        'Décote Ancienneté (%)': d.decoteAnciennete,
        'Décote Occupation (%)': d.decoteOccupation,
        'Décote Totale (%)': d.decoteTotale,
        'VNC (FCFA)': Math.round(d.valeurNetteCouverture),
        'Solde Prêt (FCFA)': h.soldePret,
        'LTV (%)': parseFloat(d.loanToValue.toFixed(2)),
        'Montant Inscription (FCFA)': h.montantInscription,
        'Rang': h.rangHypotheque,
        'Date Péremption': h.datePeremptionInscription.toLocaleDateString('fr-FR'),
        'Statut': statut,
        'Alertes': [...new Set(h.alertes.map((a) => a.type))].join(', '),
      };
    });

    // Sheet 2 — Synthèse par zone
    const byZone: Record<string, { count: number; vnc: number; solde: number }> = {
      ZONE_A: { count: 0, vnc: 0, solde: 0 },
      ZONE_B: { count: 0, vnc: 0, solde: 0 },
      ZONE_C: { count: 0, vnc: 0, solde: 0 },
    };
    let totalVnc = 0, totalSolde = 0, shortfalls = 0;

    for (const h of hypotheques) {
      const d = calculerDecotes(
        h.valeurExpertiseInitiale, h.dateExpertise, h.zoneGeographique,
        h.statutOccupation, h.soldePret, h.natureBien,
      );
      byZone[h.zoneGeographique].count++;
      byZone[h.zoneGeographique].vnc += d.valeurNetteCouverture;
      byZone[h.zoneGeographique].solde += h.soldePret;
      totalVnc += d.valeurNetteCouverture;
      totalSolde += h.soldePret;
      if (d.hasShortfall) shortfalls++;
    }

    const synthese = [
      ...Object.entries(byZone).map(([zone, data]) => ({
        'Zone': zone,
        'Nombre': data.count,
        '% Portefeuille': hypotheques.length > 0
          ? parseFloat(((data.count / hypotheques.length) * 100).toFixed(1))
          : 0,
        'VNC Totale (FCFA)': Math.round(data.vnc),
        'Solde Total Prêts (FCFA)': Math.round(data.solde),
      })),
      {
        'Zone': 'TOTAL',
        'Nombre': hypotheques.length,
        '% Portefeuille': 100,
        'VNC Totale (FCFA)': Math.round(totalVnc),
        'Solde Total Prêts (FCFA)': Math.round(totalSolde),
      },
    ];

    const wb = XLSX.utils.book_new();

    const wsDetail = XLSX.utils.json_to_sheet(detail);
    wsDetail['!cols'] = [
      { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 8 }, { wch: 20 }, { wch: 22 }, { wch: 14 },
      { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 22 }, { wch: 6 },
      { wch: 16 }, { wch: 16 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Détail Hypothèques');

    const wsSynthese = XLSX.utils.json_to_sheet(synthese);
    wsSynthese['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 22 }, { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse par Zone');

    // Sheet 3 — Indicateurs
    const indicateurs = [
      { 'Indicateur': 'Total Hypothèques', 'Valeur': hypotheques.length },
      { 'Indicateur': 'VNC Totale (FCFA)', 'Valeur': Math.round(totalVnc) },
      { 'Indicateur': 'Encours Total Prêts (FCFA)', 'Valeur': Math.round(totalSolde) },
      { 'Indicateur': 'Shortfalls', 'Valeur': shortfalls },
      {
        'Indicateur': 'LTV Moyen (%)',
        'Valeur': hypotheques.length > 0
          ? parseFloat((totalSolde / totalVnc * 100).toFixed(2))
          : 0,
      },
      { 'Indicateur': 'Année du rapport', 'Valeur': year },
      { 'Indicateur': 'Généré le', 'Valeur': new Date().toLocaleDateString('fr-FR') },
    ];
    const wsIndicateurs = XLSX.utils.json_to_sheet(indicateurs);
    wsIndicateurs['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsIndicateurs, 'Indicateurs');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `rapport-hypotheques-${year}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    logger.error('exportAnnualExcel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
