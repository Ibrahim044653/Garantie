import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaAny = prisma as any;

// ─── Coefficients BCEAO Circulaire 04-2017 ────────────────────────────────────

const COEFFICIENTS_ZONE: Record<string, number> = {
  ZONE_A: 1.00,
  ZONE_B: 0.85,
  ZONE_C: 0.70,
  ZONE_INDUSTRIELLE: 0.60,
};

// ─── POST /api/simulation/stress-test ────────────────────────────────────────

export const stressTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scenarioPct } = req.body as { scenarioPct: number };

    if (scenarioPct === undefined || isNaN(Number(scenarioPct)) || scenarioPct < 0 || scenarioPct > 80) {
      res.status(400).json({ error: 'scenarioPct doit être un nombre entre 0 et 80' });
      return;
    }

    const pct = Number(scenarioPct);

    // Fetch toutes les hypothèques dont le prêt n'est pas SOLDE ou CLOTURE
    const hypotheques = await prismaAny.hypotheque.findMany({
      include: {
        alertes: true,
        pret: true,
      },
    });

    const filtered = hypotheques.filter((h: any) => {
      if (!h.pret) return true; // pas de prêt associé → inclure
      return h.pret.statut !== 'SOLDE' && h.pret.statut !== 'CLOTURE';
    });

    interface HypoResult {
      id: number;
      nomClient: string;
      zoneGeographique: string;
      shortfallActuel: number;
      shortfallSimule: number;
      delta: number;
    }

    const results: HypoResult[] = [];

    const parZone: Record<string, { actuel: number; simule: number; delta: number; nbHypotheques: number }> = {};

    let nbShortfallsActuels = 0;
    let nbNouveauxShortfalls = 0;
    let nbShortfallsAggraves = 0;
    let totalShortfallActuel = 0;
    let totalShortfallSimule = 0;

    for (const h of filtered) {
      const valeur = Number(h.valeurExpertiseInitiale);
      const solde = Number(h.soldePret);
      const zone = h.zoneGeographique as string;
      const coeff = COEFFICIENTS_ZONE[zone] ?? 1.0;

      const vncActuel = valeur * coeff;
      const vncSimule = valeur * coeff * (1 - pct / 100);

      const shortfallActuel = Math.max(0, solde - vncActuel);
      const shortfallSimule = Math.max(0, solde - vncSimule);
      const delta = shortfallSimule - shortfallActuel;

      if (shortfallActuel > 0) nbShortfallsActuels++;
      if (shortfallActuel === 0 && shortfallSimule > 0) nbNouveauxShortfalls++;
      if (shortfallActuel > 0 && shortfallSimule > shortfallActuel) nbShortfallsAggraves++;

      totalShortfallActuel += shortfallActuel;
      totalShortfallSimule += shortfallSimule;

      // Agrégation par zone
      if (!parZone[zone]) {
        parZone[zone] = { actuel: 0, simule: 0, delta: 0, nbHypotheques: 0 };
      }
      parZone[zone].actuel += shortfallActuel;
      parZone[zone].simule += shortfallSimule;
      parZone[zone].delta += delta;
      parZone[zone].nbHypotheques += 1;

      results.push({
        id: h.id,
        nomClient: h.nomClient,
        zoneGeographique: zone,
        shortfallActuel,
        shortfallSimule,
        delta,
      });
    }

    const deltaTotal = totalShortfallSimule - totalShortfallActuel;

    // Top 10 impactés (delta desc)
    const top10Impactes = [...results]
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 10)
      .map((r) => ({
        hypothequeId: r.id,
        nomClient: r.nomClient,
        zoneGeographique: r.zoneGeographique,
        shortfallActuel: Math.round(r.shortfallActuel),
        shortfallSimule: Math.round(r.shortfallSimule),
        delta: Math.round(r.delta),
      }));

    // Arrondir les valeurs parZone
    const parZoneArrondi: Record<string, { actuel: number; simule: number; delta: number; nbHypotheques: number }> = {};
    for (const [zone, vals] of Object.entries(parZone)) {
      parZoneArrondi[zone] = {
        actuel: Math.round(vals.actuel),
        simule: Math.round(vals.simule),
        delta: Math.round(vals.delta),
        nbHypotheques: vals.nbHypotheques,
      };
    }

    const impactProvisionsEstime = Math.round(deltaTotal * 0.35);

    res.json({
      scenarioPct: pct,
      nbHypotheques: filtered.length,
      nbShortfallsActuels,
      nbNouveauxShortfalls,
      nbShortfallsAggraves,
      totalShortfallActuel: Math.round(totalShortfallActuel),
      totalShortfallSimule: Math.round(totalShortfallSimule),
      deltaTotal: Math.round(deltaTotal),
      top10Impactes,
      parZone: parZoneArrondi,
      impactProvisionsEstime,
    });
  } catch (error) {
    logger.error('Erreur stressTest simulation', { error });
    res.status(500).json({ error: 'Erreur lors du stress test' });
  }
};

// ─── POST /api/simulation/provisions ──────────────────────────────────────────

type ClasseCreance = 'SAIN' | 'SURVEILLANCE' | 'DOUTEUX' | 'CONTENTIEUX';

const TAUX_PROVISIONS: Record<ClasseCreance, number> = {
  SAIN: 0.00,
  SURVEILLANCE: 0.05,
  DOUTEUX: 0.35,
  CONTENTIEUX: 1.00,
};

// Matrice de transition trimestrielle (probabilités de dégradation)
// Chaque ligne: [reste, SAIN→SURV, SAIN→DOUT, SAIN→CONT, SURV→DOUT, SURV→CONT, DOUT→CONT]
// Simplification: on ne modélise que les dégradations (pas d'amélioration)
function applyTransition(dist: Record<ClasseCreance, number>): Record<ClasseCreance, number> {
  const { SAIN, SURVEILLANCE, DOUTEUX, CONTENTIEUX } = dist;

  const sain_to_surv = SAIN * 0.02;
  const sain_to_dout = SAIN * 0.003;
  const sain_to_cont = SAIN * 0.001;
  const surv_to_dout = SURVEILLANCE * 0.08;
  const surv_to_cont = SURVEILLANCE * 0.02;
  const dout_to_cont = DOUTEUX * 0.12;

  return {
    SAIN: SAIN - sain_to_surv - sain_to_dout - sain_to_cont,
    SURVEILLANCE: SURVEILLANCE + sain_to_surv - surv_to_dout - surv_to_cont,
    DOUTEUX: DOUTEUX + sain_to_dout + surv_to_dout - dout_to_cont,
    CONTENTIEUX: CONTENTIEUX + sain_to_cont + surv_to_cont + dout_to_cont,
  };
}

function calculerProvisionsDist(dist: Record<ClasseCreance, number>): number {
  let total = 0;
  for (const classe of ['SAIN', 'SURVEILLANCE', 'DOUTEUX', 'CONTENTIEUX'] as ClasseCreance[]) {
    total += dist[classe] * TAUX_PROVISIONS[classe];
  }
  return total;
}

export const previsionsProvisions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as { horizons?: number[] };
    const horizons = (body.horizons && body.horizons.length > 0) ? body.horizons : [1, 2, 4];

    // Fetch toutes les hypothèques avec leur prêt
    const hypotheques = await prismaAny.hypotheque.findMany({
      include: { pret: true },
    });

    // Distribution initiale
    const distribActuelle: Record<ClasseCreance, number> = {
      SAIN: 0,
      SURVEILLANCE: 0,
      DOUTEUX: 0,
      CONTENTIEUX: 0,
    };

    for (const h of hypotheques) {
      const solde = Number(h.soldePret);
      const valeur = Number(h.valeurExpertiseInitiale);
      const zone = h.zoneGeographique as string;
      const coeff = COEFFICIENTS_ZONE[zone] ?? 1.0;
      const vncActuel = valeur * coeff;
      const shortfall = Math.max(0, solde - vncActuel);

      const statutPret = h.pret?.statut as string | undefined;

      let classe: ClasseCreance;
      if (statutPret === 'EN_DEFAUT') {
        classe = 'DOUTEUX';
      } else if (statutPret === 'RENEGOCIE') {
        classe = 'SURVEILLANCE';
      } else if (statutPret === 'ACTIF') {
        classe = 'SAIN';
      } else {
        classe = 'SAIN';
      }

      // Si shortfall > 0 et statut ACTIF: forcer en SURVEILLANCE minimum
      if (shortfall > 0 && classe === 'SAIN') {
        classe = 'SURVEILLANCE';
      }

      distribActuelle[classe] += solde;
    }

    const provisionsActuelles = Math.round(calculerProvisionsDist(distribActuelle));

    // Pour chaque horizon Q, appliquer la matrice Q fois
    const horizonsResult = horizons.map((q: number) => {
      let dist: Record<ClasseCreance, number> = { ...distribActuelle };
      for (let i = 0; i < q; i++) {
        dist = applyTransition(dist);
      }
      const provisionEstimee = Math.round(calculerProvisionsDist(dist));
      return {
        quartiers: q,
        mois: q * 3,
        distribution: {
          SAIN: Math.round(dist.SAIN),
          SURVEILLANCE: Math.round(dist.SURVEILLANCE),
          DOUTEUX: Math.round(dist.DOUTEUX),
          CONTENTIEUX: Math.round(dist.CONTENTIEUX),
        },
        provisionEstimee,
        deltaVsActuel: provisionEstimee - provisionsActuelles,
      };
    });

    res.json({
      horizons: horizonsResult,
      provisionsActuelles,
      distribActuelle: {
        SAIN: Math.round(distribActuelle.SAIN),
        SURVEILLANCE: Math.round(distribActuelle.SURVEILLANCE),
        DOUTEUX: Math.round(distribActuelle.DOUTEUX),
        CONTENTIEUX: Math.round(distribActuelle.CONTENTIEUX),
      },
    });
  } catch (error) {
    logger.error('Erreur previsionsProvisions simulation', { error });
    res.status(500).json({ error: 'Erreur lors du calcul des provisions prévisionnelles' });
  }
};
