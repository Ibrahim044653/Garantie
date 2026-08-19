import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';
import {
  calculerDecotes,
  getAgeExpertiseYears,
  isInscriptionExpired,
} from '../services/calcul.service';
import {
  classifierCreance,
  calculerProvision,
  ClassificationCreance,
} from '../services/provision.service';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatioPrudentiel {
  libelle: string;
  valeur: number | null;
  seuil: number | null;
  unite: string;
  statut: 'FAVORABLE' | 'ATTENTION' | 'DEFAVORABLE';
  commentaire: string;
}

// Explicit shape (avoids relying on stale Prisma generated includes)
interface HypothequeRow {
  id: number;
  nomClient: string;
  codeClient: string;
  numeroPret: string;
  valeurExpertiseInitiale: number | { toNumber: () => number };
  dateExpertise: Date;
  datePeremptionInscription: Date;
  soldePret: number | { toNumber: () => number };
  zoneGeographique: string;
  statutOccupation: string;
  natureBien: string;
  pret?: {
    statut: string;
    echeances: Array<{ statut: string }>;
  } | null;
  client?: {
    codeClient: string;
    nom: string;
    prenom?: string | null;
    raisonSociale?: string | null;
  } | null;
}

// ─── Shared fetch ─────────────────────────────────────────────────────────────

async function fetchHypotheques(): Promise<HypothequeRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaAny = prisma as any;
  return prismaAny.hypotheque.findMany({
    include: {
      pret: {
        include: {
          echeances: {
            where: { statut: 'IMPAYE' },
          },
        },
      },
      client: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Per-hypotheque computation ───────────────────────────────────────────────

function computeRow(h: HypothequeRow) {
  const valeurExpertise = Number(h.valeurExpertiseInitiale);
  const soldePret = Number(h.soldePret);

  const d = calculerDecotes(
    valeurExpertise,
    h.dateExpertise,
    h.zoneGeographique,
    h.statutOccupation,
    soldePret,
    h.natureBien,
  );

  const ageExpertise = getAgeExpertiseYears(h.dateExpertise);
  const inscriptionPerimee = isInscriptionExpired(h.datePeremptionInscription);
  const impayes = h.pret?.echeances?.length ?? 0;
  const statutPret = h.pret?.statut ?? null;

  const classification = classifierCreance(
    d.loanToValue,
    ageExpertise,
    inscriptionPerimee,
    statutPret,
    impayes,
  );

  const ead = soldePret;
  const vnc = d.valeurNetteCouverture;
  const { lgd, pd, ecl, provision } = calculerProvision(ead, vnc, classification);

  const nomClient =
    h.client
      ? h.client.raisonSociale ?? `${h.client.nom}${h.client.prenom ? ' ' + h.client.prenom : ''}`
      : h.nomClient;
  const codeClient = h.client?.codeClient ?? h.codeClient;

  return {
    hypothequeId: h.id,
    nomClient,
    codeClient,
    numeroPret: h.numeroPret,
    zoneGeographique: h.zoneGeographique as string,
    natureBien: h.natureBien as string,
    statutOccupation: h.statutOccupation as string,
    classification,
    ead,
    vnc,
    lgd,
    pd,
    ecl,
    provision,
    ltv: d.loanToValue,
    ageExpertise,
    inscriptionPerimee,
    hasShortfall: d.hasShortfall,
    impayes,
    statutPret,
  };
}

// ─── Build ratios ─────────────────────────────────────────────────────────────

function buildRatios(rows: ReturnType<typeof computeRow>[]) {
  const n = rows.length;
  const encoursTotalFCFA = rows.reduce((s, r) => s + r.ead, 0);
  const vncTotalFCFA = rows.reduce((s, r) => s + r.vnc, 0);
  const provisionsTotalFCFA = rows.reduce((s, r) => s + r.provision, 0);
  const shortfallCount = rows.filter((r) => r.hasShortfall).length;

  // By classification
  const classifications: ClassificationCreance[] = ['SAIN', 'SOUS_SURVEILLANCE', 'DOUTEUX', 'CONTENTIEUX'];
  const byClass: Record<ClassificationCreance, { encours: number; provision: number; count: number }> = {
    SAIN: { encours: 0, provision: 0, count: 0 },
    SOUS_SURVEILLANCE: { encours: 0, provision: 0, count: 0 },
    DOUTEUX: { encours: 0, provision: 0, count: 0 },
    CONTENTIEUX: { encours: 0, provision: 0, count: 0 },
  };
  for (const r of rows) {
    byClass[r.classification].encours += r.ead;
    byClass[r.classification].provision += r.provision;
    byClass[r.classification].count += 1;
  }

  // Zone C encours
  const encours_zone_c = rows
    .filter((r) => r.zoneGeographique === 'ZONE_C')
    .reduce((s, r) => s + r.ead, 0);

  // Grands risques: group by codeClient, sum encours, flag > 15% of total
  const clientMap = new Map<string, { nom: string; encours: number }>();
  for (const r of rows) {
    const existing = clientMap.get(r.codeClient);
    if (existing) {
      existing.encours += r.ead;
    } else {
      clientMap.set(r.codeClient, { nom: r.nomClient, encours: r.ead });
    }
  }
  const grandsRisques = Array.from(clientMap.entries())
    .map(([codeClient, v]) => ({
      codeClient,
      nom: v.nom,
      encours: Math.round(v.encours),
      pct: encoursTotalFCFA > 0 ? parseFloat(((v.encours / encoursTotalFCFA) * 100).toFixed(2)) : 0,
      depasseSeuil: encoursTotalFCFA > 0 && v.encours / encoursTotalFCFA > 0.15,
    }))
    .sort((a, b) => b.pct - a.pct);

  const maxClientPct = grandsRisques.length > 0 ? grandsRisques[0].pct : 0;
  const concentration = grandsRisques.slice(0, 5);

  // NPL = DOUTEUX + CONTENTIEUX
  const nplEncours = byClass.DOUTEUX.encours + byClass.CONTENTIEUX.encours;

  // Ratios prudentiels
  const tauxCouverture = encoursTotalFCFA > 0 ? (vncTotalFCFA / encoursTotalFCFA) * 100 : 0;
  const ratioNPL = encoursTotalFCFA > 0 ? (nplEncours / encoursTotalFCFA) * 100 : 0;
  const tauxProvisionnement = encoursTotalFCFA > 0 ? (provisionsTotalFCFA / encoursTotalFCFA) * 100 : 0;
  const tauxShortfall = n > 0 ? (shortfallCount / n) * 100 : 0;
  const tauxZoneC = encoursTotalFCFA > 0 ? (encours_zone_c / encoursTotalFCFA) * 100 : 0;

  const ratiosPrudentiels: RatioPrudentiel[] = [
    {
      libelle: 'Taux de couverture global (VNC/Encours)',
      valeur: parseFloat(tauxCouverture.toFixed(2)),
      seuil: 100,
      unite: '%',
      statut: tauxCouverture >= 100 ? 'FAVORABLE' : tauxCouverture >= 70 ? 'ATTENTION' : 'DEFAVORABLE',
      commentaire:
        tauxCouverture >= 100
          ? 'La valeur nette de couverture couvre intégralement les encours.'
          : tauxCouverture >= 70
          ? 'Couverture partielle — surveiller les shortfalls.'
          : 'Couverture insuffisante — exposition significative non couverte.',
    },
    {
      libelle: 'Ratio NPL (Douteux + Contentieux)',
      valeur: parseFloat(ratioNPL.toFixed(2)),
      seuil: 3,
      unite: '%',
      statut: ratioNPL < 3 ? 'FAVORABLE' : ratioNPL < 5 ? 'ATTENTION' : 'DEFAVORABLE',
      commentaire:
        ratioNPL < 3
          ? 'Taux de créances non performantes maîtrisé.'
          : ratioNPL < 5
          ? 'Taux NPL en zone de surveillance.'
          : 'Taux NPL élevé — action corrective requise.',
    },
    {
      libelle: 'Taux de provisionnement',
      valeur: parseFloat(tauxProvisionnement.toFixed(2)),
      seuil: null,
      unite: '%',
      statut: 'FAVORABLE',
      commentaire: 'Taux de provisionnement IFRS 9 / BCEAO — informatif.',
    },
    {
      libelle: 'Concentration max client (BCEAO ≤ 75%)',
      valeur: parseFloat(maxClientPct.toFixed(2)),
      seuil: 75,
      unite: '%',
      statut: maxClientPct < 50 ? 'FAVORABLE' : maxClientPct < 75 ? 'ATTENTION' : 'DEFAVORABLE',
      commentaire:
        maxClientPct < 50
          ? 'Concentration client bien répartie.'
          : maxClientPct < 75
          ? 'Concentration client élevée — surveiller le grand risque.'
          : 'Dépassement du seuil BCEAO de 75% — signalement requis.',
    },
    {
      libelle: 'Exposition Zone C (risque élevé)',
      valeur: parseFloat(tauxZoneC.toFixed(2)),
      seuil: 30,
      unite: '%',
      statut: tauxZoneC < 20 ? 'FAVORABLE' : tauxZoneC < 30 ? 'ATTENTION' : 'DEFAVORABLE',
      commentaire:
        tauxZoneC < 20
          ? 'Exposition Zone C maîtrisée.'
          : tauxZoneC < 30
          ? 'Exposition Zone C significative — à surveiller.'
          : 'Exposition Zone C excessive — décotes élevées applicables.',
    },
    {
      libelle: 'Taux de shortfall',
      valeur: parseFloat(tauxShortfall.toFixed(2)),
      seuil: 5,
      unite: '%',
      statut: tauxShortfall < 5 ? 'FAVORABLE' : tauxShortfall < 10 ? 'ATTENTION' : 'DEFAVORABLE',
      commentaire:
        tauxShortfall < 5
          ? 'Taux de shortfall acceptable.'
          : tauxShortfall < 10
          ? 'Taux de shortfall en zone de vigilance.'
          : 'Taux de shortfall élevé — réévaluation des garanties nécessaire.',
    },
  ];

  // État SYSCOHADA
  const etatSYSCOHADA = [
    {
      rubrique: 'Créances saines (Classe 1)',
      classification: 'SAIN' as ClassificationCreance,
      encours: Math.round(byClass.SAIN.encours),
      provisions: Math.round(byClass.SAIN.provision),
      count: byClass.SAIN.count,
    },
    {
      rubrique: 'Créances sous surveillance (Classe 2)',
      classification: 'SOUS_SURVEILLANCE' as ClassificationCreance,
      encours: Math.round(byClass.SOUS_SURVEILLANCE.encours),
      provisions: Math.round(byClass.SOUS_SURVEILLANCE.provision),
      count: byClass.SOUS_SURVEILLANCE.count,
    },
    {
      rubrique: 'Créances douteuses (Classe 3)',
      classification: 'DOUTEUX' as ClassificationCreance,
      encours: Math.round(byClass.DOUTEUX.encours),
      provisions: Math.round(byClass.DOUTEUX.provision),
      count: byClass.DOUTEUX.count,
    },
    {
      rubrique: 'Créances en contentieux (Classe 4)',
      classification: 'CONTENTIEUX' as ClassificationCreance,
      encours: Math.round(byClass.CONTENTIEUX.encours),
      provisions: Math.round(byClass.CONTENTIEUX.provision),
      count: byClass.CONTENTIEUX.count,
    },
  ];

  return {
    rows,
    encoursTotalFCFA: Math.round(encoursTotalFCFA),
    vncTotaleFCFA: Math.round(vncTotalFCFA),
    provisionsTotalFCFA: Math.round(provisionsTotalFCFA),
    tauxCouverture: parseFloat(tauxCouverture.toFixed(2)),
    shortfallCount,
    n,
    ratiosPrudentiels,
    grandsRisques,
    concentration,
    etatSYSCOHADA,
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getRatios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await fetchHypotheques();
    const rows = hypotheques.map(computeRow);
    const r = buildRatios(rows);
    const currentYear = new Date().getFullYear();

    res.json({
      generatedAt: new Date().toISOString(),
      annee: currentYear,
      portefeuille: {
        nombreHypotheques: r.n,
        encoursTotalFCFA: r.encoursTotalFCFA,
        vncTotaleFCFA: r.vncTotaleFCFA,
        tauxCouverture: r.tauxCouverture,
        provisions: r.provisionsTotalFCFA,
      },
      ratiosPrudentiels: r.ratiosPrudentiels,
      grandsRisques: r.grandsRisques.filter((g) => g.depasseSeuil),
      concentration: r.concentration,
      etatSYSCOHADA: r.etatSYSCOHADA,
    });
  } catch (error) {
    logger.error('Erreur getRatios', { error });
    res.status(500).json({ error: 'Erreur lors du calcul des ratios BCEAO' });
  }
};

export const exportBCEAO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await fetchHypotheques();
    const rows = hypotheques.map(computeRow);
    const r = buildRatios(rows);
    const year = new Date().getFullYear();

    // Sheet 1 — Ratios Prudentiels
    const ws1Rows = r.ratiosPrudentiels.map((rp) => ({
      Indicateur: rp.libelle,
      'Valeur (%)': rp.valeur ?? 'N/A',
      'Seuil (%)': rp.seuil ?? 'N/A',
      Statut: rp.statut,
      Commentaire: rp.commentaire,
    }));

    // Sheet 2 — Grands Risques
    const ws2Rows = r.grandsRisques.map((gr) => ({
      'Code Client': gr.codeClient,
      'Nom / Raison Sociale': gr.nom,
      'Encours FCFA': gr.encours,
      '% du Portefeuille': gr.pct,
      'Dépasse Seuil 15%': gr.depasseSeuil ? 'Oui' : 'Non',
    }));

    // Sheet 3 — État SYSCOHADA
    const ws3Rows = r.etatSYSCOHADA.map((e) => ({
      Rubrique: e.rubrique,
      'Nombre Créances': e.count,
      'Encours FCFA': e.encours,
      'Provisions FCFA': e.provisions,
      'Taux Provisionnement (%)':
        e.encours > 0 ? parseFloat(((e.provisions / e.encours) * 100).toFixed(2)) : 0,
    }));

    // Sheet 4 — Détail Portefeuille
    const ws4Rows = r.rows.map((row) => ({
      'ID Hypothèque': row.hypothequeId,
      'N° Prêt': row.numeroPret,
      Client: row.nomClient,
      'Code Client': row.codeClient,
      Zone: row.zoneGeographique,
      Nature: row.natureBien,
      Occupation: row.statutOccupation,
      Classification: row.classification,
      'Encours FCFA': Math.round(row.ead),
      'VNC FCFA': Math.round(row.vnc),
      'LTV (%)': parseFloat(row.ltv.toFixed(2)),
      'LGD (%)': parseFloat((row.lgd * 100).toFixed(2)),
      'Provision FCFA': row.provision,
      'Age Expertise (ans)': parseFloat(row.ageExpertise.toFixed(1)),
      Impayés: row.impayes,
      'Statut Prêt': row.statutPret ?? 'N/A',
      'Inscription Périmée': row.inscriptionPerimee ? 'Oui' : 'Non',
      Shortfall: row.hasShortfall ? 'Oui' : 'Non',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ws1Rows), 'Ratios Prudentiels');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ws2Rows), 'Grands Risques');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ws3Rows), 'État SYSCOHADA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ws4Rows), 'Détail Portefeuille');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `reporting-bceao-${year}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (error) {
    logger.error('Erreur exportBCEAO', { error });
    res.status(500).json({ error: "Erreur lors de l'export BCEAO" });
  }
};
