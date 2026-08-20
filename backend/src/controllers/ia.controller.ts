import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaAny = prisma as any;

// ─── Types locaux ─────────────────────────────────────────────────────────────

type Rating = 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';

const PD_PAR_RATING: Record<Rating, number> = {
  AA: 0.002,
  A: 0.005,
  BBB: 0.015,
  BB: 0.035,
  B: 0.08,
  CCC: 0.18,
};

// ─── Helpers scoring IA ───────────────────────────────────────────────────────

function scoreLtv(ltv: number): number {
  if (ltv < 0.5) return 100;
  if (ltv < 0.6) return 85;
  if (ltv < 0.7) return 70;
  if (ltv < 0.8) return 55;
  return 30;
}

function scoreZone(zone: string): number {
  switch (zone) {
    case 'ZONE_A': return 100;
    case 'ZONE_B': return 80;
    case 'ZONE_C': return 60;
    case 'ZONE_INDUSTRIELLE': return 70;
    default: return 60;
  }
}

function scoreNatureBien(nature: string): number {
  switch (nature) {
    case 'VILLA':
    case 'IMMEUBLE_RAPPORT': return 90;
    case 'BUREAU': return 80;
    case 'USINE': return 70;
    case 'TERRAIN_NU': return 65;
    default: return 65;
  }
}

function scoreStatutPret(statut: string | null | undefined): number {
  switch (statut) {
    case 'ACTIF': return 95;
    case 'RENEGOCIE': return 65;
    case 'EN_DEFAUT': return 25;
    case 'CLOTURE':
    case 'SOLDE': return 100;
    default: return 95;
  }
}

function scoreAncienneteExpertise(dateExpertise: Date): number {
  const ageMs = Date.now() - new Date(dateExpertise).getTime();
  const ageAns = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  if (ageAns < 1) return 100;
  if (ageAns < 2) return 80;
  if (ageAns < 3) return 60;
  return 30;
}

function computeRating(score: number): Rating {
  if (score >= 85) return 'AA';
  if (score >= 70) return 'A';
  if (score >= 55) return 'BBB';
  if (score >= 40) return 'BB';
  if (score >= 25) return 'B';
  return 'CCC';
}

// ─── GET /api/ia/scoring ──────────────────────────────────────────────────────

export const scoring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prismaAny.hypotheque.findMany({
      include: {
        pret: {
          include: { echeances: true },
        },
      },
    });

    const data = hypotheques.map((h: any) => {
      const valeur = Number(h.valeurExpertiseInitiale);
      const solde = Number(h.soldePret);
      const ltv = valeur > 0 ? solde / valeur : 0;

      const sLtv = scoreLtv(ltv);
      const sZone = scoreZone(h.zoneGeographique);
      const sNature = scoreNatureBien(h.natureBien);
      const sStatut = scoreStatutPret(h.pret?.statut);
      const sAnciennete = scoreAncienneteExpertise(h.dateExpertise);

      const score = parseFloat(
        (sLtv * 0.30 + sZone * 0.20 + sNature * 0.15 + sStatut * 0.25 + sAnciennete * 0.10).toFixed(2),
      );

      const rating = computeRating(score);
      const probabiliteDefaut = PD_PAR_RATING[rating];

      return {
        hypothequeId: h.id,
        nomClient: h.nomClient,
        codeClient: h.codeClient,
        numeroPret: h.numeroPret,
        score,
        rating,
        probabiliteDefaut,
        ltv: parseFloat((ltv * 100).toFixed(2)),
        detail: {
          ltv: sLtv,
          zone: sZone,
          natureBien: sNature,
          statutPret: sStatut,
          ancienneteExpertise: sAnciennete,
        },
      };
    });

    // Distribution des ratings
    const ratings: Rating[] = ['AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
    const n = data.length;
    const distributionRatings = {} as Record<Rating, { count: number; pct: number }>;
    for (const r of ratings) {
      const count = data.filter((d: any) => d.rating === r).length;
      distributionRatings[r] = {
        count,
        pct: n > 0 ? parseFloat(((count / n) * 100).toFixed(2)) : 0,
      };
    }

    const scoreMoyenPortefeuille = n > 0
      ? parseFloat((data.reduce((s: number, d: any) => s + d.score, 0) / n).toFixed(2))
      : 0;

    res.json({ data, distributionRatings, scoreMoyenPortefeuille });
  } catch (error) {
    logger.error('Erreur scoring IA', { error });
    res.status(500).json({ error: 'Erreur lors du calcul du scoring IA' });
  }
};

// ─── GET /api/ia/anomalies ────────────────────────────────────────────────────

type SeveriteAnomalie = 'haute' | 'moyenne';
type TypeAnomalie = 'VALEUR_ABERRANTE' | 'EXPERTISE_PERIMEE' | 'LTV_EXCESSIVE';

interface Anomalie {
  hypothequeId: number;
  nomClient: string;
  type: TypeAnomalie;
  severite: SeveriteAnomalie;
  valeur: number;
  zScore?: number;
  detail: string;
}

export const anomalies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prismaAny.hypotheque.findMany({});

    // Grouper par (zone, nature)
    const groupes: Record<string, any[]> = {};
    for (const h of hypotheques) {
      const cle = `${h.zoneGeographique}__${h.natureBien}`;
      if (!groupes[cle]) groupes[cle] = [];
      groupes[cle].push(h);
    }

    const anomaliesDetectees: Anomalie[] = [];
    const now = Date.now();
    const TROIS_ANS_MS = 3 * 365.25 * 24 * 60 * 60 * 1000;

    for (const h of hypotheques) {
      const valeur = Number(h.valeurExpertiseInitiale);
      const solde = Number(h.soldePret);

      // 1. Expertise périmée (> 3 ans)
      const ageMs = now - new Date(h.dateExpertise).getTime();
      if (ageMs > TROIS_ANS_MS) {
        anomaliesDetectees.push({
          hypothequeId: h.id,
          nomClient: h.nomClient,
          type: 'EXPERTISE_PERIMEE',
          severite: 'moyenne',
          valeur,
          detail: `Expertise datant de plus de 3 ans (${new Date(h.dateExpertise).toISOString().slice(0, 10)})`,
        });
      }

      // 2. LTV > 100% (shortfall total)
      const ltv = valeur > 0 ? solde / valeur : 0;
      if (ltv > 1.0) {
        anomaliesDetectees.push({
          hypothequeId: h.id,
          nomClient: h.nomClient,
          type: 'LTV_EXCESSIVE',
          severite: 'haute',
          valeur,
          detail: `LTV de ${(ltv * 100).toFixed(1)}% — le solde dépasse la valeur du bien`,
        });
      }
    }

    // 3. Valeurs aberrantes par groupe (z-score)
    for (const [, groupe] of Object.entries(groupes)) {
      if (groupe.length < 3) continue;

      const valeurs = groupe.map((h: any) => Number(h.valeurExpertiseInitiale));
      const mean = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
      const variance = valeurs.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / valeurs.length;
      const std = Math.sqrt(variance);

      if (std === 0) continue;

      for (const h of groupe) {
        const valeur = Number(h.valeurExpertiseInitiale);
        const zScore = Math.abs((valeur - mean) / std);
        if (zScore > 2.0) {
          anomaliesDetectees.push({
            hypothequeId: h.id,
            nomClient: h.nomClient,
            type: 'VALEUR_ABERRANTE',
            severite: zScore > 3.0 ? 'haute' : 'moyenne',
            valeur,
            zScore: parseFloat(zScore.toFixed(2)),
            detail: `Valeur d'expertise aberrante (z-score: ${zScore.toFixed(2)}, moyenne du groupe: ${Math.round(mean)})`,
          });
        }
      }
    }

    // Dédupliquer par hypothequeId+type
    const seen = new Set<string>();
    const unique = anomaliesDetectees.filter((a) => {
      const key = `${a.hypothequeId}__${a.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Trier: haute d'abord
    unique.sort((a, b) => {
      if (a.severite === b.severite) return a.hypothequeId - b.hypothequeId;
      return a.severite === 'haute' ? -1 : 1;
    });

    res.json({ anomalies: unique, total: unique.length });
  } catch (error) {
    logger.error('Erreur anomalies IA', { error });
    res.status(500).json({ error: 'Erreur lors de la détection des anomalies' });
  }
};

// ─── GET /api/ia/reclassification ─────────────────────────────────────────────

type ClasseSYSCOHADA = 'Sain' | 'Sous surveillance' | 'Douteux' | 'Contentieux';

function classificationActuelle(statutPret: string | null | undefined): ClasseSYSCOHADA {
  switch (statutPret) {
    case 'ACTIF': return 'Sain';
    case 'RENEGOCIE': return 'Sous surveillance';
    case 'EN_DEFAUT': return 'Contentieux';
    default: return 'Sain';
  }
}

function classificationRecommandee(
  nbImpayes: number,
  ltv: number,
  statutPret: string | null | undefined,
): ClasseSYSCOHADA {
  if (statutPret === 'EN_DEFAUT' && ltv > 1.0) return 'Contentieux';
  if (nbImpayes >= 3 || statutPret === 'EN_DEFAUT') return 'Contentieux';
  if (nbImpayes >= 1 || ltv > 1.0) return 'Douteux';
  if (ltv >= 0.8 && ltv <= 1.0) return 'Sous surveillance';
  return 'Sain';
}

export const reclassification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hypotheques = await prismaAny.hypotheque.findMany({
      include: {
        pret: {
          include: {
            echeances: {
              where: { statut: 'IMPAYE' },
            },
          },
        },
      },
    });

    const divergences: Array<{
      hypothequeId: number;
      nomClient: string;
      codeClient: string;
      numeroPret: string;
      classificationActuelle: ClasseSYSCOHADA;
      classificationRecommandee: ClasseSYSCOHADA;
      raison: string;
      ltv: number;
      nbImpayes: number;
      statutPret: string | null;
    }> = [];

    for (const h of hypotheques) {
      const valeur = Number(h.valeurExpertiseInitiale);
      const solde = Number(h.soldePret);
      const ltv = valeur > 0 ? solde / valeur : 0;
      const statutPret = h.pret?.statut as string | null | undefined;
      const nbImpayes = h.pret?.echeances?.length ?? 0;

      const actuelle = classificationActuelle(statutPret);
      const recommandee = classificationRecommandee(nbImpayes, ltv, statutPret);

      if (actuelle !== recommandee) {
        const raisons: string[] = [];
        if (nbImpayes >= 3) raisons.push(`${nbImpayes} échéances impayées`);
        else if (nbImpayes >= 1) raisons.push(`${nbImpayes} échéance(s) impayée(s)`);
        if (ltv > 1.0) raisons.push(`LTV de ${(ltv * 100).toFixed(1)}% (shortfall)`);
        else if (ltv >= 0.8) raisons.push(`LTV de ${(ltv * 100).toFixed(1)}%`);
        if (statutPret === 'EN_DEFAUT') raisons.push('statut prêt EN_DEFAUT');

        divergences.push({
          hypothequeId: h.id,
          nomClient: h.nomClient,
          codeClient: h.codeClient,
          numeroPret: h.numeroPret,
          classificationActuelle: actuelle,
          classificationRecommandee: recommandee,
          raison: raisons.join(', ') || 'Reclassification recommandée selon les critères SYSCOHADA',
          ltv: parseFloat((ltv * 100).toFixed(2)),
          nbImpayes,
          statutPret: statutPret ?? null,
        });
      }
    }

    res.json({ divergences, total: divergences.length });
  } catch (error) {
    logger.error('Erreur reclassification IA', { error });
    res.status(500).json({ error: 'Erreur lors de la reclassification' });
  }
};
