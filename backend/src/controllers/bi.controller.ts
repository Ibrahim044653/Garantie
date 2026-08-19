import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../services/logger';
import { calculerDecotes, getAgeExpertiseYears } from '../services/calcul.service';
import { classifierCreance, calculerProvision } from '../services/provision.service';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYYYYMM(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthsBefore(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

// Parse YYYY-MM or YYYY-Qn into { start, end }
function parsePeriode(p: string): { start: Date; end: Date; label: string } {
  const quarterMatch = p.match(/^(\d{4})-Q([1-4])$/);
  if (quarterMatch) {
    const year = parseInt(quarterMatch[1]);
    const q = parseInt(quarterMatch[2]);
    const startMonth = (q - 1) * 3; // 0, 3, 6, 9
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
    return { start, end, label: p };
  }
  const monthMatch = p.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = parseInt(monthMatch[1]);
    const month = parseInt(monthMatch[2]) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return { start, end, label: p };
  }
  throw new Error(`Invalid periode format: ${p}`);
}

// ─── GET /api/bi/overview ─────────────────────────────────────────────────────
export const getOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch all hypotheques with full data
    const hypotheques = await prisma.hypotheque.findMany({
      include: {
        historique: { orderBy: { dateModification: 'desc' } },
        pret: { select: { statut: true } },
        client: { select: { nom: true, codeClient: true } },
        alertes: { where: { lu: false } },
      },
    });

    const now = new Date();
    const lastMonth = monthsBefore(1);

    // Build current computed values
    let encours = 0;
    let vncTotale = 0;
    let shortfalls = 0;
    let provisionsTotal = 0;
    let ltvSum = 0;
    let ltvCount = 0;

    const classifications: Record<string, number> = { SAIN: 0, SOUS_SURVEILLANCE: 0, DOUTEUX: 0, CONTENTIEUX: 0 };
    const byZoneMap: Record<string, { count: number; encours: number; vnc: number; shortfalls: number }> = {};

    const topRisques: Array<{ hypothequeId: number; nomClient: string; ltv: number; vnc: number; ead: number; classification: string }> = [];

    // Also collect per-month VNC for trend
    const monthlyVncMap: Record<string, number> = {};

    for (const h of hypotheques) {
      const ead = Number(h.soldePret);
      encours += ead;

      const decotes = calculerDecotes(
        Number(h.valeurExpertiseInitiale),
        h.dateExpertise,
        h.zoneGeographique,
        h.statutOccupation,
        ead,
        h.natureBien,
      );
      const vnc = decotes.valeurNetteCouverture;
      const ltv = decotes.loanToValue;
      const ageExp = getAgeExpertiseYears(h.dateExpertise);
      const inscriptionPerimee = new Date(h.datePeremptionInscription) < now;

      // Count impayes from echeances if available (rough via statut pret)
      const impayes = h.pret?.statut === 'EN_DEFAUT' ? 3 : 0;
      const classification = classifierCreance(ltv, ageExp, inscriptionPerimee, h.pret?.statut || null, impayes);
      const { provision } = calculerProvision(ead, vnc, classification);

      vncTotale += vnc;
      provisionsTotal += provision;
      ltvSum += ltv;
      ltvCount++;
      if (decotes.hasShortfall) shortfalls++;
      classifications[classification] = (classifications[classification] || 0) + 1;

      // By zone
      const zone = h.zoneGeographique;
      if (!byZoneMap[zone]) byZoneMap[zone] = { count: 0, encours: 0, vnc: 0, shortfalls: 0 };
      byZoneMap[zone].count++;
      byZoneMap[zone].encours += ead;
      byZoneMap[zone].vnc += vnc;
      if (decotes.hasShortfall) byZoneMap[zone].shortfalls++;

      topRisques.push({
        hypothequeId: h.id,
        nomClient: h.nomClient,
        ltv,
        vnc,
        ead,
        classification,
      });

      // Monthly trend: aggregate VNC from historique
      for (const hv of h.historique) {
        const mois = toYYYYMM(hv.dateModification);
        monthlyVncMap[mois] = (monthlyVncMap[mois] || 0) + Number(hv.valeurNetteCouverture);
      }
    }

    // Top 5 risques by LTV desc
    topRisques.sort((a, b) => b.ltv - a.ltv);
    const top5 = topRisques.slice(0, 5);

    // Build 24-month trend
    const tendances: Array<{ mois: string; vnc: number; encours: number }> = [];
    for (let i = 23; i >= 0; i--) {
      const d = monthsBefore(i);
      const mois = toYYYYMM(d);
      tendances.push({ mois, vnc: monthlyVncMap[mois] || 0, encours: 0 });
    }
    // Fill encours (current value, as we don't have historical encours)
    if (tendances.length > 0) {
      tendances[tendances.length - 1].encours = encours;
    }

    // Last month comparison — sum VNC from historique entries dated last month
    let vncLastMonth = 0;
    let encoursLastMonth = 0;
    for (const h of hypotheques) {
      const lastMonthHv = h.historique.find(hv => {
        const d = new Date(hv.dateModification);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      });
      if (lastMonthHv) {
        vncLastMonth += Number(lastMonthHv.valeurNetteCouverture);
        encoursLastMonth += Number(h.soldePret); // approximation
      }
    }

    const ltvMoyen = ltvCount > 0 ? ltvSum / ltvCount : 0;
    const tauxCouverture = encours > 0 ? (vncTotale / encours) * 100 : 0;

    const vncGrowthPct = vncLastMonth > 0 ? ((vncTotale - vncLastMonth) / vncLastMonth) * 100 : 0;
    const encoursGrowthPct = encoursLastMonth > 0 ? ((encours - encoursLastMonth) / encoursLastMonth) * 100 : 0;

    const byZone = Object.entries(byZoneMap).map(([zone, d]) => ({
      zone,
      count: d.count,
      encours: d.encours,
      vnc: d.vnc,
      tauxCouverture: d.encours > 0 ? (d.vnc / d.encours) * 100 : 0,
      shortfalls: d.shortfalls,
    }));

    res.json({
      kpis: {
        encours,
        encoursGrowthPct: Math.round(encoursGrowthPct * 100) / 100,
        vncTotale,
        vncGrowthPct: Math.round(vncGrowthPct * 100) / 100,
        shortfalls,
        provisionsTotal,
        ltvMoyen: Math.round(ltvMoyen * 100) / 100,
        tauxCouverture: Math.round(tauxCouverture * 100) / 100,
      },
      tendances,
      byZone,
      classifications,
      topRisques: top5,
    });
  } catch (err) {
    logger.error('BI getOverview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/bi/comparaison ──────────────────────────────────────────────────
export const getComparaisonPeriodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { periode1, periode2 } = req.query as { periode1?: string; periode2?: string };

    if (!periode1 || !periode2) {
      res.status(400).json({ error: 'periode1 and periode2 query params are required (YYYY-MM or YYYY-Qn)' });
      return;
    }

    let p1: ReturnType<typeof parsePeriode>;
    let p2: ReturnType<typeof parsePeriode>;
    try {
      p1 = parsePeriode(periode1);
      p2 = parsePeriode(periode2);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
      return;
    }

    async function computePeriodeStats(period: { start: Date; end: Date; label: string }) {
      const historiques = await prisma.historiqueValeur.findMany({
        where: { dateModification: { gte: period.start, lte: period.end } },
        include: {
          hypotheque: { select: { soldePret: true, datePeremptionInscription: true, pret: { select: { statut: true } } } },
        },
      });

      if (historiques.length === 0) {
        return { label: period.label, encours: 0, vnc: 0, shortfalls: 0, ltvMoyen: 0 };
      }

      let encours = 0;
      let vnc = 0;
      let shortfalls = 0;
      let ltvSum = 0;
      let count = 0;

      for (const hv of historiques) {
        const ead = Number(hv.hypotheque.soldePret);
        const hvVnc = Number(hv.valeurNetteCouverture);
        const ltv = Number(hv.loanToValue);
        encours += ead;
        vnc += hvVnc;
        ltvSum += ltv;
        count++;
        if (ead > hvVnc) shortfalls++;
      }

      return {
        label: period.label,
        encours: Math.round(encours / count),
        vnc: Math.round(vnc / count),
        shortfalls,
        ltvMoyen: Math.round((ltvSum / count) * 100) / 100,
      };
    }

    const [r1, r2] = await Promise.all([computePeriodeStats(p1), computePeriodeStats(p2)]);

    const delta = {
      encours: r1.encours > 0 ? Math.round(((r2.encours - r1.encours) / r1.encours) * 10000) / 100 : 0,
      vnc: r1.vnc > 0 ? Math.round(((r2.vnc - r1.vnc) / r1.vnc) * 10000) / 100 : 0,
      shortfalls: r2.shortfalls - r1.shortfalls,
    };

    res.json({ periode1: r1, periode2: r2, delta });
  } catch (err) {
    logger.error('BI getComparaisonPeriodes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/bi/kpis ─────────────────────────────────────────────────────────
export const getKPIsByRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (role === 'ADMIN') {
      // All KPIs — delegate to overview logic
      const [totalHypotheques, totalClients, totalPrets, alertesNonLues, workflowPending] = await Promise.all([
        prisma.hypotheque.count(),
        prisma.client.count(),
        prisma.pret.count(),
        prisma.alert.count({ where: { lu: false } }),
        prisma.demandeValidation.count({ where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } } }),
      ]);
      res.json({ role, kpis: { totalHypotheques, totalClients, totalPrets, alertesNonLues, workflowPending } });
      return;
    }

    if (role === 'GESTIONNAIRE_GARANTIES') {
      const [newHypothequesMois, workflowPending, alertesNonLues] = await Promise.all([
        prisma.hypotheque.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.demandeValidation.count({ where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } } }),
        prisma.alert.count({ where: { lu: false } }),
      ]);
      res.json({ role, kpis: { newHypothequesMois, workflowPending, alertesNonLues } });
      return;
    }

    if (role === 'RESPONSABLE_RISQUES') {
      const hypotheques = await prisma.hypotheque.findMany({
        include: { pret: { select: { statut: true } } },
      });

      const classifications: Record<string, number> = { SAIN: 0, SOUS_SURVEILLANCE: 0, DOUTEUX: 0, CONTENTIEUX: 0 };
      let shortfalls = 0;
      let provisionsTotal = 0;
      let ltvSum = 0;

      for (const h of hypotheques) {
        const ead = Number(h.soldePret);
        const decotes = calculerDecotes(Number(h.valeurExpertiseInitiale), h.dateExpertise, h.zoneGeographique, h.statutOccupation, ead, h.natureBien);
        const ageExp = getAgeExpertiseYears(h.dateExpertise);
        const inscriptionPerimee = new Date(h.datePeremptionInscription) < now;
        const impayes = h.pret?.statut === 'EN_DEFAUT' ? 3 : 0;
        const c = classifierCreance(decotes.loanToValue, ageExp, inscriptionPerimee, h.pret?.statut || null, impayes);
        const { provision } = calculerProvision(ead, decotes.valeurNetteCouverture, c);
        classifications[c] = (classifications[c] || 0) + 1;
        if (decotes.hasShortfall) shortfalls++;
        provisionsTotal += provision;
        ltvSum += decotes.loanToValue;
      }

      const ltvMoyen = hypotheques.length > 0 ? ltvSum / hypotheques.length : 0;
      res.json({ role, kpis: { classifications, shortfalls, provisionsTotal, ltvMoyen: Math.round(ltvMoyen * 100) / 100 } });
      return;
    }

    if (role === 'ENGAGEMENTS') {
      const [totalPrets, pretActifs, pretDefaut, echeancesImpayees] = await Promise.all([
        prisma.pret.count(),
        prisma.pret.count({ where: { statut: 'ACTIF' } }),
        prisma.pret.count({ where: { statut: 'EN_DEFAUT' } }),
        prisma.echeancePret.count({ where: { statut: 'IMPAYE' } }),
      ]);

      const pretAggregate = await prisma.pret.aggregate({ _sum: { montantRestant: true }, where: { statut: { in: ['ACTIF', 'EN_DEFAUT'] } } });
      const encours = Number(pretAggregate._sum.montantRestant || 0);

      res.json({ role, kpis: { totalPrets, pretActifs, pretDefaut, echeancesImpayees, encours } });
      return;
    }

    if (role === 'AUDIT_INTERNE') {
      const [inscriptionsPerimees, expertises5ans] = await Promise.all([
        prisma.hypotheque.count({ where: { datePeremptionInscription: { lt: now } } }),
        prisma.hypotheque.count({ where: { dateExpertise: { lt: new Date(now.getTime() - 5 * 365.25 * 24 * 60 * 60 * 1000) } } }),
      ]);
      res.json({ role, kpis: { inscriptionsPerimees, expertises5ans } });
      return;
    }

    res.json({ role, kpis: {} });
  } catch (err) {
    logger.error('BI getKPIsByRole error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
