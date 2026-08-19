import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';
import { calculerDecotes, getAgeExpertiseYears, isInscriptionExpired } from '../services/calcul.service';
import {
  calculerScore,
  PD_PAR_NIVEAU,
  NiveauScore,
  LABEL_NIVEAU,
} from '../services/scoring.service';
import { classifierCreance, calculerProvision } from '../services/provision.service';

const prisma = new PrismaClient();

// ─── Explicit type (avoids relying on stale Prisma generated includes) ────────

interface HypothequeWithPret {
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

async function fetchHypotheques(): Promise<HypothequeWithPret[]> {
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

// ─── Per-hypotheque scoring ───────────────────────────────────────────────────

function scorerHypotheque(h: HypothequeWithPret, valeurFactor = 1.0) {
  const valeurExpertise = Number(h.valeurExpertiseInitiale) * valeurFactor;
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
  const { lgd, pd: pdProv, ecl, provision } = calculerProvision(ead, vnc, classification);

  const { score, niveau, detail } = calculerScore(
    d.loanToValue,
    ageExpertise,
    h.zoneGeographique,
    h.statutOccupation,
    h.natureBien,
  );

  const pd = PD_PAR_NIVEAU[niveau];
  const expectedLoss = pd * lgd * ead;

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
    score,
    niveau,
    label: LABEL_NIVEAU[niveau],
    pd,
    lgd,
    ead,
    expectedLoss: Math.round(expectedLoss),
    vnc: Math.round(vnc),
    ltv: parseFloat(d.loanToValue.toFixed(2)),
    detail,
    // Extra for stress tests
    _hasShortfall: d.hasShortfall,
    _provision: provision,
    _classification: classification,
    _ecl: ecl,
  };
}

// ─── Stress test helper ───────────────────────────────────────────────────────

function runStressScenario(hypotheques: HypothequeWithPret[], factor: number) {
  let vncTotal = 0;
  let shortfalls = 0;
  let provisionsTotal = 0;
  let nplCount = 0;

  for (const h of hypotheques) {
    const r = scorerHypotheque(h, factor);
    vncTotal += r.vnc;
    provisionsTotal += r._provision;
    if (r._hasShortfall) shortfalls++;
    if (r.ltv > 100) nplCount++;
  }

  const total = hypotheques.length;
  return {
    vncTotal: Math.round(vncTotal),
    shortfalls,
    provisionsTotal: Math.round(provisionsTotal),
    nplRatio: total > 0 ? parseFloat(((nplCount / total) * 100).toFixed(2)) : 0,
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getScoring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await fetchHypotheques();

    const data = hypotheques.map((h) => scorerHypotheque(h, 1.0));

    // Summary
    const n = data.length;
    const scoreMoyen = n > 0 ? parseFloat((data.reduce((s, r) => s + r.score, 0) / n).toFixed(2)) : 0;
    const pdMoyen = n > 0 ? parseFloat((data.reduce((s, r) => s + r.pd, 0) / n).toFixed(4)) : 0;
    const lgdMoyen = n > 0 ? parseFloat((data.reduce((s, r) => s + r.lgd, 0) / n).toFixed(4)) : 0;
    const expectedLossTotal = Math.round(data.reduce((s, r) => s + r.expectedLoss, 0));

    const niveaux: NiveauScore[] = ['AAA', 'BBB', 'BB', 'B', 'CCC'];
    const distribution = {} as Record<NiveauScore, { count: number; pct: number }>;
    for (const niv of niveaux) {
      const count = data.filter((r) => r.niveau === niv).length;
      distribution[niv] = { count, pct: n > 0 ? parseFloat(((count / n) * 100).toFixed(2)) : 0 };
    }

    const summary = { scoreMoyen, distribution, pdMoyen, lgdMoyen, expectedLossTotal };

    // Stress tests
    const baselineRes = runStressScenario(hypotheques, 1.0);
    const adverseRes = runStressScenario(hypotheques, 0.85);
    const severeRes = runStressScenario(hypotheques, 0.70);

    const stressTests = {
      baseline: { facteur: 1.0, label: 'Scénario de base', ...baselineRes },
      adverse: { facteur: 0.85, label: 'Scénario adverse (-15%)', ...adverseRes },
      severe: { facteur: 0.70, label: 'Scénario sévère (-30%)', ...severeRes },
    };

    // Strip internal fields from data
    const publicData = data.map(({ _hasShortfall, _provision, _classification, _ecl, ...rest }) => rest);

    res.json({ summary, data: publicData, stressTests });
  } catch (error) {
    logger.error('Erreur getScoring', { error });
    res.status(500).json({ error: 'Erreur lors du calcul du scoring' });
  }
};

export const getStressTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facteur = parseFloat((req.query.facteur as string) ?? '0.85');
    if (isNaN(facteur) || facteur <= 0 || facteur > 2) {
      res.status(400).json({ error: 'Le facteur doit être un nombre entre 0 et 2' });
      return;
    }

    const hypotheques = await fetchHypotheques();

    const resultats = hypotheques.map((h) => {
      const avant = scorerHypotheque(h, 1.0);
      const apres = scorerHypotheque(h, facteur);
      return {
        hypothequeId: h.id,
        nomClient: avant.nomClient,
        ltv_avant: avant.ltv,
        ltv_apres: apres.ltv,
        shortfall_avant: avant._hasShortfall,
        shortfall_apres: apres._hasShortfall,
        vnc_avant: avant.vnc,
        vnc_apres: apres.vnc,
      };
    });

    const summaryAvant = runStressScenario(hypotheques, 1.0);
    const summaryApres = runStressScenario(hypotheques, facteur);

    const summary = {
      vnc_avant: summaryAvant.vncTotal,
      vnc_apres: summaryApres.vncTotal,
      shortfalls_avant: summaryAvant.shortfalls,
      shortfalls_apres: summaryApres.shortfalls,
      provisions_avant: summaryAvant.provisionsTotal,
      provisions_apres: summaryApres.provisionsTotal,
    };

    res.json({ facteur, resultats, summary });
  } catch (error) {
    logger.error('Erreur getStressTest', { error });
    res.status(500).json({ error: 'Erreur lors du stress test' });
  }
};
